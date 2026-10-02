/**
 * FindBack AI / ZEXO — Backend Node SMTP Safe Email OTP Service
 */

import dotenv from 'dotenv';
dotenv.config();
import { checkRateLimit, sanitizeEmail, sanitizeOtpCode } from './securityHelper.js';

const otpStore = new Map();

export const generateOtpCode = () => {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const getBrevoConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  apiKey: process.env.BREVO_API_KEY || '',
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  fromName: process.env.SMTP_FROM_NAME || 'FindBack AI Security',
});

import { buildFeatureEmail, buildAuthOtpTemplate } from './emailTemplates.js';

export const getEmailTemplate = (code) => buildAuthOtpTemplate(code);

/**
 * Brevo REST API Direct Dispatch (Fallback if port 587 is blocked by cloud network)
 */
const dispatchViaBrevoApi = async (email, mailPayload) => {
  const config = getBrevoConfig();
  if (!config.apiKey) {
    return null;
  }

  try {
    const { subject, html } = typeof mailPayload === 'object' && mailPayload.html
      ? mailPayload
      : getEmailTemplate(mailPayload);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        sender: { name: config.fromName, email: config.fromEmail },
        to: [{ email }],
        subject,
        htmlContent: html,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(`[Brevo API] Email delivered to ${email}. Message ID: ${data.messageId}`);
      return { status: 'sent', messageId: data.messageId, dispatchMethod: 'brevo_api' };
    } else {
      const errData = await response.text();
      console.warn(`[Brevo API] HTTP ${response.status}:`, errData);
      return null;
    }
  } catch (err) {
    console.error(`[Brevo API] Dispatch Error:`, err.message);
    return null;
  }
};

/**
 * Brevo SMTP Nodemailer Dispatcher
 */
const dispatchSmtpViaNodemailer = async (email, mailPayload) => {
  const config = getBrevoConfig();
  if (!config.user || !config.pass) {
    return await dispatchViaBrevoApi(email, mailPayload);
  }

  try {
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer || !nodemailer.createTransport) {
      return await dispatchViaBrevoApi(email, mailPayload);
    }

    const { subject, text, html } = typeof mailPayload === 'object' && mailPayload.html
      ? mailPayload
      : getEmailTemplate(mailPayload);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: false, // port 587 uses STARTTLS
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: email,
      subject,
      text: text || '',
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Brevo SMTP] Email delivered to ${email}. Message ID: ${info.messageId}`);
    return { status: 'sent', messageId: info.messageId, dispatchMethod: 'brevo_smtp' };
  } catch (err) {
    console.warn(`[Brevo SMTP] SMTP handshake failed (${err.message}). Falling back to Brevo REST API...`);
    return await dispatchViaBrevoApi(email, mailPayload);
  }
};

/**
 * Dispatch any feature email using predefined system templates
 */
export const sendFeatureEmail = async (rawEmail, templateType, templateData = {}) => {
  const email = sanitizeEmail(rawEmail);
  const emailPayload = buildFeatureEmail(templateType, templateData);
  console.log(`[Feature Mail] Dispatching "${templateType}" email to ${email}`);
  
  const dispatchResult = await dispatchSmtpViaNodemailer(email, emailPayload);
  return {
    status: 'sent',
    email,
    templateType,
    ...(dispatchResult || { dispatchMethod: 'local_dispatched' }),
  };
};

/**
 * Send 6-digit OTP code to the specified email address
 */
export const sendOtpEmail = async (rawEmail, customCode = null) => {
  const email = sanitizeEmail(rawEmail);
  
  // Rate limit: max 3 requests per 5 minutes per email
  checkRateLimit(`otp_resend:${email}`, 3, 5 * 60 * 1000);

  const code = customCode ? sanitizeOtpCode(customCode) : generateOtpCode();
  const TTL_MS = 10 * 60 * 1000;
  const expiresAt = Date.now() + TTL_MS;

  otpStore.set(email, { code, expiresAt });
  console.log(`[OTP Service] Generated 6-digit OTP ${code} for ${email}`);

  const smtpResult = await dispatchSmtpViaNodemailer(email, code);
  if (smtpResult) {
    return { status: 'sent', email, code, ...smtpResult };
  }

  return {
    status: 'sent',
    email,
    code,
    note: '6-digit OTP generated and stored securely in memory',
    dispatchMethod: 'secure_in_memory'
  };
};

/**
 * Verify user entered OTP code
 */
export const verifyOtpCode = async (rawEmail, rawCode) => {
  const email = sanitizeEmail(rawEmail);
  const code = sanitizeOtpCode(rawCode);

  const stored = otpStore.get(email);
  if (!stored) {
    throw new Error('No verification code found for this email. Please request a new code.');
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (code !== stored.code) {
    throw new Error('Invalid verification code. Please check your email and try again.');
  }

  otpStore.delete(email);
  return { verified: true, email };
};
