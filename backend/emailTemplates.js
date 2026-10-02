/**
 * FindBack AI / ZEXO — Enterprise Email Template Engine
 * 15 Enterprise-Grade, Fully-Responsive HTML Email Templates
 * Designed with the FindBack AI System Palette (#0F1F3D, #2563EB, #10B981, #F59E0B)
 */

const BASE_URL = 'https://findback-ai.onrender.com';

/**
 * Standard Email Shell Wrapper
 * Ensures 100% email client compatibility across Outlook, Gmail, Apple Mail, and mobile.
 */
export const wrapEmailShell = ({
  badgeText = '🔒 FindBack AI Security',
  badgeColor = '#1D4ED8',
  badgeBg = '#EFF6FF',
  badgeBorder = '#BFDBFE',
  title = '',
  preheader = '',
  bodyContent = '',
  ctaText = 'Launch FindBack AI Enterprise Portal →',
  ctaUrl = BASE_URL,
}) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <title>${title || 'FindBack AI Notification'}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100%; background-color: #0B132B; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .otp-digit { width: 36px !important; height: 48px !important; line-height: 48px !important; font-size: 22px !important; }
      .content-padding { padding: 24px 18px !important; }
      .header-padding { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0B132B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
  <div style="display: none; font-size: 1px; color: #0B132B; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader || title}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: radial-gradient(circle at top, #1E1B4B 0%, #0B132B 65%, #050B18 100%); background-color: #0B132B; padding: 40px 14px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1); border-collapse: separate;">
          
          <!-- Header Banner (Primary Deep Navy #0F1F3D) -->
          <tr>
            <td class="header-padding" style="background-color: #0F1F3D; background-image: linear-gradient(135deg, #0F1F3D 0%, #172554 50%, #1E1B4B 100%); padding: 32px 28px 28px 28px; text-align: center; border-bottom: 2px solid #2563EB;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); border-radius: 12px; width: 40px; height: 40px; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                    <span style="color: #FFFFFF; font-size: 20px; line-height: 40px; display: inline-block;">✦</span>
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; display: inline-block; line-height: 1.1;">
                      FindBack <span style="color: #60A5FA;">AI</span>
                    </span>
                    <br>
                    <span style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; display: inline-block; margin-top: 2px;">
                      Autonomous Recovery Network
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body Area -->
          <tr>
            <td class="content-padding" style="padding: 36px 32px 24px 32px; text-align: center;">
              
              <!-- Badge Pill -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  <td style="background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 9999px; padding: 6px 16px;">
                    <span style="font-size: 11px; font-weight: 800; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Main Title -->
              <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #0F1F3D; letter-spacing: -0.4px; line-height: 1.3;">
                ${title}
              </h1>

              <!-- Dynamic Feature Body -->
              ${bodyContent}

              <!-- Call to Action Button -->
              ${
                ctaText && ctaUrl
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #0F1F3D; background-image: linear-gradient(135deg, #0F1F3D 0%, #1E1B4B 100%); color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 6px 16px -2px rgba(15, 31, 61, 0.35); border: 1px solid rgba(255, 255, 255, 0.1);">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 28px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #475569;">
                FindBack AI Enterprise · Autonomous Recovery Network
              </p>
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #94A3B8; line-height: 1.5;">
                Protected by Attribute-Based Access Control (ABAC), Zero-Knowledge Handovers & Dual Cryptographic Signatures.
              </p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">
                <a href="${BASE_URL}" target="_blank" style="color: #2563EB; font-weight: 600; text-decoration: underline;">findback-ai.onrender.com</a> · Cloud Instance Production Gateway
              </p>
            </td>
          </tr>

        </table>

        <!-- Security Sub-notice -->
        <p style="margin: 18px 0 0 0; font-size: 10px; color: #64748B; text-align: center;">
          This is an automated system notification from the FindBack AI Cloud Security Infrastructure.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 1. AUTH_OTP — Authentication Passcode (Login / 2FA / Register)
 */
export const buildAuthOtpTemplate = (codeParam) => {
  const dynamicCode = (typeof codeParam === 'object' ? codeParam?.code : codeParam) || String(Math.floor(100000 + Math.random() * 900000));
  const digits = String(dynamicCode).padStart(6, '0').slice(0, 6).split('');
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding: 0 3px;"><div class="otp-digit" style="display: inline-block; width: 42px; height: 54px; line-height: 54px; text-align: center; font-size: 26px; font-weight: 900; font-family: monospace; color: #0F1F3D; background-color: #FFFFFF; border: 2px solid #2563EB; border-radius: 10px; box-shadow: 0 4px 10px -2px rgba(37, 99, 235, 0.18);">${d}</div></td>`
    )
    .join('');

  const bodyContent = `
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      We received an authentication request for your account. Enter the 6-digit verification code below to verify your identity:
    </p>

    <!-- OTP Code Display Card -->
    <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 22px 14px 18px 14px; margin: 0 0 24px 0; text-align: center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
        <tr>${digitBoxes}</tr>
      </table>
      <p style="margin: 14px 0 0 0; font-size: 12px; font-weight: 700; color: #2563EB;">
        ⏱️ Valid for 10 minutes only · Single use
      </p>
    </div>

    <!-- Security Metadata Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; text-align: left; font-size: 12px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Protocol:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right; font-family: monospace;">SHA-256 Nonce / Brevo Relay</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Access Level:</td>
        <td style="color: #059669; font-weight: 700; text-align: right;">Encrypted Session Authentication</td>
      </tr>
    </table>

    <!-- Advisory -->
    <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 14px; border-radius: 6px; text-align: left;">
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400E;">
        <strong>Security Advisory:</strong> Never disclose this code. FindBack AI staff and recovery officers will never ask for your OTP.
      </p>
    </div>
  `;

  return {
    subject: `🔐 Your FindBack AI Verification Code: ${dynamicCode}`,
    text: `Your FindBack AI verification code is: ${dynamicCode}. Valid for 10 minutes. Do not share this code.`,
    html: wrapEmailShell({
      badgeText: '🔒 Authentication Passcode',
      badgeColor: '#1D4ED8',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      title: 'Security Verification',
      preheader: `Your verification code is ${dynamicCode}`,
      bodyContent,
      ctaText: 'Launch FindBack AI Portal →',
      ctaUrl: `${BASE_URL}/login`,
    }),
  };
};

/**
 * 2. WELCOME_USER — Account Activation & Onboarding Welcome
 */
export const buildWelcomeTemplate = ({ name, email, role = 'user' }) => {
  const roleDisplay = role === 'admin' ? 'Enterprise Administrator' : role === 'officer' ? 'Campus Recovery Officer' : 'Verified Citizen';
  
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Hello <strong>${name || email}</strong>, welcome to <strong>FindBack AI Enterprise</strong>. Your account has been provisioned on our cloud infrastructure with <strong>${roleDisplay}</strong> credentials.
    </p>

    <!-- Role Highlight Box -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; text-align: left; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Assigned Role:</div>
      <div style="font-size: 16px; font-weight: 800; color: #0F1F3D;">${roleDisplay}</div>
      <div style="font-size: 12px; color: #2563EB; margin-top: 6px;">
        ${role === 'officer' ? 'Access to Vault Handover Desks & Evidence Auditing' : role === 'admin' ? 'Full Access to ABAC Engine, Matching Telemetry & System Config' : 'Access to Lost & Found Wizard, Smart Tags & AI Match Tracker'}
      </div>
    </div>

    <!-- Quick Steps Checklist -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align: left; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 0; color: #059669; font-weight: bold; width: 24px;">✓</td>
        <td style="padding: 6px 0; color: #334155;">Report lost or found belongings with instant AI visual tagger</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #059669; font-weight: bold;">✓</td>
        <td style="padding: 6px 0; color: #334155;">Generate free cryptographic Smart QR / NFC recovery tags</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #059669; font-weight: bold;">✓</td>
        <td style="padding: 6px 0; color: #334155;">Enjoy tamper-proof handovers protected by SHA-256 digital certificates</td>
      </tr>
    </table>
  `;

  return {
    subject: `🚀 Welcome to FindBack AI — ${roleDisplay}`,
    text: `Welcome to FindBack AI Enterprise, ${name || email}! Your ${roleDisplay} account is ready.`,
    html: wrapEmailShell({
      badgeText: '✨ Account Activated',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      title: 'Welcome to the Autonomous Network',
      preheader: 'Your FindBack AI enterprise account is active and verified.',
      bodyContent,
      ctaText: 'Access Your Dashboard →',
      ctaUrl: `${BASE_URL}/dashboard`,
    }),
  };
};

/**
 * 3. PASSWORD_RESET — Secure Password Reset Request
 */
export const buildPasswordResetTemplate = ({ email, resetToken, resetUrl }) => {
  const targetUrl = resetUrl || `${BASE_URL}/reset-password?token=${resetToken || 'sec_token'}&email=${encodeURIComponent(email || '')}`;
  
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      We received a password reset request for your account (<strong>${email}</strong>). Click the secure link below to set a new password:
    </p>

    <!-- Expiration Card -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left;">
      <div style="font-size: 12px; color: #64748B;">This password reset link is cryptographically signed and expires in <strong>15 minutes</strong>.</div>
    </div>

    <!-- Advisory -->
    <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 14px; border-radius: 6px; text-align: left;">
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400E;">
        If you did not request a password reset, you can safely disregard this email. Your current credentials remain secure.
      </p>
    </div>
  `;

  return {
    subject: `🔑 Reset Your FindBack AI Password`,
    text: `Password reset request received for ${email}. Use this link: ${targetUrl} (Valid for 15 mins).`,
    html: wrapEmailShell({
      badgeText: '🛡️ Password Recovery',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      badgeBorder: '#FDE68A',
      title: 'Reset Account Password',
      preheader: 'Reset your FindBack AI account password securely.',
      bodyContent,
      ctaText: 'Reset Password Now →',
      ctaUrl: targetUrl,
    }),
  };
};

/**
 * 4. SECURITY_ALERT — Suspicious Login or Account Alert
 */
export const buildSecurityAlertTemplate = ({ email, ipAddress = 'Cloud IP 104.28.x.x', device = 'Chrome on Windows 11', location = 'Chennai, India', time = new Date().toUTCString() }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Our autonomous security engine detected a new session login to your account (<strong>${email}</strong>) from an unrecognized location or device.
    </p>

    <!-- Telemetry Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 14px 16px; margin-bottom: 22px; text-align: left; font-size: 12px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Device:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${device}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Location:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${location}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">IP Address:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right; font-family: monospace;">${ipAddress}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Timestamp:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${time}</td>
      </tr>
    </table>

    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 14px; border-radius: 6px; text-align: left;">
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #991B1B;">
        <strong>Not you?</strong> If you didn't initiate this login, immediately click below to revoke all active sessions and change your password.
      </p>
    </div>
  `;

  return {
    subject: `🚨 Security Notice: New Sign-In to FindBack AI`,
    text: `Security alert for ${email}: New login detected from ${device} (${location}). If this wasn't you, revoke access immediately.`,
    html: wrapEmailShell({
      badgeText: '⚠️ Security Incident Alert',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeBorder: '#FECACA',
      title: 'New Sign-In Detected',
      preheader: `New sign-in detected from ${device} in ${location}.`,
      bodyContent,
      ctaText: 'Secure My Account Now →',
      ctaUrl: `${BASE_URL}/profile`,
    }),
  };
};

/**
 * 5. REPORT_LOST_CONFIRMATION — Lost Property Report Receipt
 */
export const buildReportLostConfirmationTemplate = ({ reportId, title: itemTitle, category, dateLost, location }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Your lost property incident has been officially registered in the FindBack AI Cloud Registry. Our multi-modal matching model is now scanning matching items in campus vaults.
    </p>

    <!-- Incident Summary Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 14px; padding: 18px 20px; margin-bottom: 22px; text-align: left; font-size: 13px; border: 1.5px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Tracking ID:</td>
        <td style="color: #2563EB; font-weight: 800; text-align: right; font-family: monospace;">#${reportId}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Item Name:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${itemTitle}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Category:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${category || 'General'}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Date Reported:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${dateLost || 'Today'}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Last Seen Location:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${location || 'Campus Grounds'}</td>
      </tr>
    </table>

    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px; text-align: left;">
      <div style="font-size: 12px; font-weight: 700; color: #1D4ED8; margin-bottom: 4px;">💡 Pro-Tip: Generate a Smart Tag</div>
      <div style="font-size: 12px; color: #334155; line-height: 1.5;">
        You can attach a free FindBack AI QR/NFC recovery tag to your other belongings to enable 1-tap anonymous returns.
      </div>
    </div>
  `;

  return {
    subject: `📋 Lost Report Filed: #${reportId} (${itemTitle})`,
    text: `Lost item report #${reportId} for "${itemTitle}" has been filed. Tracking URL: ${BASE_URL}/my-reports`,
    html: wrapEmailShell({
      badgeText: '📌 Lost Property Filed',
      badgeColor: '#2563EB',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      title: 'Incident Registration Confirmed',
      preheader: `Your lost report #${reportId} is active in the network.`,
      bodyContent,
      ctaText: 'Track Report Status →',
      ctaUrl: `${BASE_URL}/my-reports`,
    }),
  };
};

/**
 * 6. REPORT_FOUND_CONFIRMATION — Found Property Registration in Vault
 */
export const buildReportFoundConfirmationTemplate = ({ reportId, title: itemTitle, category, vaultLocker = 'Security Vault Desk 1' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Thank you for your honesty and community service! The found item you logged has been assigned an audit tracking number and queued for matching against lost property reports.
    </p>

    <!-- Found Item Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 14px; padding: 18px 20px; margin-bottom: 22px; text-align: left; font-size: 13px; border: 1.5px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Registry ID:</td>
        <td style="color: #059669; font-weight: 800; text-align: right; font-family: monospace;">#${reportId}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Item Description:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${itemTitle}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Category:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${category || 'General'}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Custodian Vault:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${vaultLocker}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
      You will receive a notification and a Good Samaritan Certificate once the rightful owner claims the item.
    </p>
  `;

  return {
    subject: `🤝 Found Item Registered: #${reportId} (${itemTitle})`,
    text: `Thank you for reporting "${itemTitle}". It is logged as #${reportId} and placed under safe custody.`,
    html: wrapEmailShell({
      badgeText: '📦 Found Property Logged',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      title: 'Custody Registration Confirmed',
      preheader: `Found item #${reportId} is securely logged.`,
      bodyContent,
      ctaText: 'View Custody Log →',
      ctaUrl: `${BASE_URL}/my-reports`,
    }),
  };
};

/**
 * 7. AI_MATCH_FOUND — High Confidence Match Detected
 */
export const buildAiMatchFoundTemplate = ({ matchId, lostTitle, foundTitle, confidenceScore = 94, category, locationProximity = 'Within 50 meters' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Great news! The FindBack AI multi-modal vision and spatial matching engine has identified a <strong>high-confidence match</strong> for your lost item:
    </p>

    <!-- Match Score Gauge Box -->
    <div style="background-color: #EEF2FF; border: 2px solid #818CF8; border-radius: 16px; padding: 22px 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #4F46E5; letter-spacing: 1.2px; margin-bottom: 6px;">
        🤖 AI Confidence Score
      </div>
      <div style="font-size: 38px; font-weight: 900; color: #1E1B4B; line-height: 1;">
        ${confidenceScore}%
      </div>
      <div style="font-size: 12px; font-weight: 600; color: #4338CA; margin-top: 6px;">
        High-Probability Visual & Spatial Correlation
      </div>
    </div>

    <!-- Match Comparison Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 12px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Your Lost Item:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${lostTitle}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Matched Found Item:</td>
        <td style="color: #059669; font-weight: 700; text-align: right;">${foundTitle}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Proximity:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${locationProximity}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
      Review the photos and details now. If this is your item, you can submit ownership evidence in 1-click.
    </p>
  `;

  return {
    subject: `🎯 AI Match Alert (${confidenceScore}%): "${lostTitle}"`,
    text: `AI found a ${confidenceScore}% match for your lost item "${lostTitle}". View details: ${BASE_URL}/matches`,
    html: wrapEmailShell({
      badgeText: '🤖 AI Autonomous Match',
      badgeColor: '#4F46E5',
      badgeBg: '#EEF2FF',
      badgeBorder: '#C7D2FE',
      title: 'Potential Match Discovered!',
      preheader: `AI found a ${confidenceScore}% match for "${lostTitle}"`,
      bodyContent,
      ctaText: 'Inspect Match & Claim Item →',
      ctaUrl: `${BASE_URL}/matches`,
    }),
  };
};

/**
 * 8. CLAIM_SUBMITTED — Claim Received & Queued for Review
 */
export const buildClaimSubmittedTemplate = ({ claimId, itemTitle, evidenceCount = 1 }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Your ownership claim for <strong>${itemTitle}</strong> has been received by the Central Campus Security verification desk.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: left; font-size: 13px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Claim Reference:</td>
        <td style="color: #2563EB; font-weight: 800; text-align: right; font-family: monospace;">#${claimId}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Attached Evidence:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${evidenceCount} item(s)</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Review SLA:</td>
        <td style="color: #059669; font-weight: 700; text-align: right;">Under 24 Hours</td>
      </tr>
    </table>

    <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 12px 14px; border-radius: 6px; text-align: left;">
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #1E40AF;">
        A Campus Officer will audit your ownership evidence against vault inspection records. You will receive an email once approved.
      </p>
    </div>
  `;

  return {
    subject: `📝 Claim Received: #${claimId} (${itemTitle})`,
    text: `Your claim for "${itemTitle}" (#${claimId}) is currently under review by Campus Security.`,
    html: wrapEmailShell({
      badgeText: '⚖️ Claim Under Review',
      badgeColor: '#2563EB',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      title: 'Ownership Claim Queued',
      preheader: `Claim #${claimId} submitted for security verification.`,
      bodyContent,
      ctaText: 'Check Claim Status →',
      ctaUrl: `${BASE_URL}/evidence-status`,
    }),
  };
};

/**
 * 9. CLAIM_EVIDENCE_REQUESTED — Additional Proof Needed
 */
export const buildEvidenceRequestedTemplate = ({ claimId, itemTitle, officerNotes = 'Please provide a serial number or purchase invoice.' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      A Campus Recovery Officer has reviewed your claim for <strong>${itemTitle}</strong> and requested supplemental evidence before approval.
    </p>

    <!-- Officer Message Box -->
    <div style="background-color: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: left;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B45309; margin-bottom: 4px;">Officer Note:</div>
      <div style="font-size: 13px; color: #92400E; line-height: 1.5;">"${officerNotes}"</div>
    </div>

    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
      Accepted proofs include purchase receipts, device serial numbers, distinctive markings, or photos with the item.
    </p>
  `;

  return {
    subject: `⚠️ Action Required: Additional Evidence Needed for Claim #${claimId}`,
    text: `Officer requested additional evidence for "${itemTitle}". Note: ${officerNotes}`,
    html: wrapEmailShell({
      badgeText: '⚠️ Additional Evidence Needed',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      badgeBorder: '#FDE68A',
      title: 'Evidence Requested',
      preheader: `Officer requested extra proof for claim #${claimId}.`,
      bodyContent,
      ctaText: 'Upload Evidence Proofs →',
      ctaUrl: `${BASE_URL}/evidence-status`,
    }),
  };
};

/**
 * 10. CLAIM_APPROVED — Claim Approved by Campus Security
 */
export const buildClaimApprovedTemplate = ({ claimId, itemTitle, pickupLocation = 'Central Campus Security Desk 1', pickupHours = '09:00 AM – 06:00 PM' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Congratulations! Your ownership claim for <strong>${itemTitle}</strong> has been officially <strong>verified and approved</strong> by campus authorities.
    </p>

    <!-- Handover Info Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: left; font-size: 13px;">
      <tr>
        <td style="color: #047857; padding: 5px 0; font-weight: 600;">Status:</td>
        <td style="color: #065F46; font-weight: 800; text-align: right;">APPROVED FOR HANDOVER</td>
      </tr>
      <tr>
        <td style="color: #047857; padding: 5px 0; font-weight: 600;">Pickup Desk:</td>
        <td style="color: #065F46; font-weight: 700; text-align: right;">${pickupLocation}</td>
      </tr>
      <tr>
        <td style="color: #047857; padding: 5px 0; font-weight: 600;">Operating Hours:</td>
        <td style="color: #065F46; font-weight: 700; text-align: right;">${pickupHours}</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
      Your 6-digit cryptographic release code is ready. Bring a valid government or university photo ID to complete custody transfer.
    </p>
  `;

  return {
    subject: `🎉 Claim Approved: "${itemTitle}" is Ready for Pickup!`,
    text: `Your claim #${claimId} for "${itemTitle}" is approved! Pickup at ${pickupLocation}.`,
    html: wrapEmailShell({
      badgeText: '✅ Claim Approved',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      title: 'Ready for Collection',
      preheader: `Claim approved! Pick up your "${itemTitle}" at ${pickupLocation}.`,
      bodyContent,
      ctaText: 'View Handover Passcode →',
      ctaUrl: `${BASE_URL}/handover-status`,
    }),
  };
};

/**
 * 11. CLAIM_REJECTED — Claim Declined / Disputed
 */
export const buildClaimRejectedTemplate = ({ claimId, itemTitle, reasonNotes = 'Evidence did not match physical item attributes.' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      After careful examination of the submitted evidence, campus recovery officers were unable to verify ownership for <strong>${itemTitle}</strong> (Claim #${claimId}).
    </p>

    <!-- Review Notes Box -->
    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: left;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B91C1C; margin-bottom: 4px;">Review Finding:</div>
      <div style="font-size: 13px; color: #991B1B; line-height: 1.5;">"${reasonNotes}"</div>
    </div>

    <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
      If you believe this was an error, you may file an appeal or submit higher-fidelity evidence with an administrator.
    </p>
  `;

  return {
    subject: `Claim Decision: #${claimId} (${itemTitle})`,
    text: `Update on claim #${claimId} for "${itemTitle}": Declined. Review note: ${reasonNotes}`,
    html: wrapEmailShell({
      badgeText: '✕ Claim Decision Notice',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeBorder: '#FECACA',
      title: 'Claim Review Update',
      preheader: `Decision update on claim #${claimId}.`,
      bodyContent,
      ctaText: 'File Claim Appeal →',
      ctaUrl: `${BASE_URL}/evidence-status`,
    }),
  };
};

/**
 * 12. HANDOVER_PASSCODE — 6-Digit Item Release Passcode
 */
export const buildHandoverPasscodeTemplate = ({ verificationCode, itemTitle, handoverDesk = 'Central Campus Security Desk 1' } = {}) => {
  const dynamicCode = verificationCode || String(Math.floor(100000 + Math.random() * 900000));
  const digits = String(dynamicCode).padStart(6, '0').slice(0, 6).split('');
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding: 0 3px;"><div class="otp-digit" style="display: inline-block; width: 42px; height: 54px; line-height: 54px; text-align: center; font-size: 26px; font-weight: 900; font-family: monospace; color: #0F1F3D; background-color: #FFFFFF; border: 2px solid #059669; border-radius: 10px; box-shadow: 0 4px 10px -2px rgba(5, 150, 105, 0.2);">${d}</div></td>`
    )
    .join('');

  const bodyContent = `
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Present this 6-digit cryptographic release code to the Officer at <strong>${handoverDesk}</strong> to release <strong>${itemTitle}</strong>:
    </p>

    <!-- Release Passcode Box -->
    <div style="background-color: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: 16px; padding: 22px 14px 18px 14px; margin: 0 0 24px 0; text-align: center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
        <tr>${digitBoxes}</tr>
      </table>
      <p style="margin: 14px 0 0 0; font-size: 12px; font-weight: 700; color: #059669;">
        🔒 Single-Use Tamper-Proof Handover Code
      </p>
    </div>

    <!-- Instructions -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 14px 16px; text-align: left; font-size: 12px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 4px 0;">Location:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${handoverDesk}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 4px 0;">Requirement:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">Physical Photo ID Required</td>
      </tr>
    </table>
  `;

  return {
    subject: `🔐 Handover Release Passcode: ${dynamicCode} (${itemTitle})`,
    text: `Your item release code for "${itemTitle}" is: ${dynamicCode}. Present it at ${handoverDesk}.`,
    html: wrapEmailShell({
      badgeText: '🔑 Item Release Passcode',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      title: 'Custody Handover Code',
      preheader: `Release code for "${itemTitle}": ${dynamicCode}`,
      bodyContent,
      ctaText: 'Open Live Handover QR →',
      ctaUrl: `${BASE_URL}/handover-status`,
    }),
  };
};

/**
 * 13. HANDOVER_CERTIFICATE — Digital Certificate of Return & Receipt
 */
export const buildHandoverCertificateTemplate = ({ certId, itemTitle, receiptHash, completedAt, officerBadge = 'OFFICER-742' }) => {
  const shortHash = receiptHash ? `${receiptHash.substring(0, 16)}...${receiptHash.substring(receiptHash.length - 8)}` : 'sha256_verified';

  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      The custody transfer of <strong>${itemTitle}</strong> has been successfully finalized and cryptographically verified.
    </p>

    <!-- Certificate Seal Box -->
    <div style="background-color: #F8FAFC; border: 2px solid #2563EB; border-radius: 16px; padding: 22px 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 28px; line-height: 1; margin-bottom: 8px;">🛡️</div>
      <div style="font-size: 16px; font-weight: 900; color: #0F1F3D; letter-spacing: -0.3px;">
        DIGITAL HANDOVER CERTIFICATE
      </div>
      <div style="font-size: 12px; font-weight: 700; color: #2563EB; margin-top: 4px;">
        #${certId || 'ZEXO-CERT-RECOVERY'}
      </div>
    </div>

    <!-- Cryptographic Audit Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 22px; text-align: left; font-size: 12px; border: 1px solid #E2E8F0;">
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Item Name:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${itemTitle}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Officer Badge:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${officerBadge}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">Completed Date:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${completedAt || 'Today'}</td>
      </tr>
      <tr>
        <td style="color: #64748B; padding: 5px 0;">SHA-256 Audit:</td>
        <td style="color: #059669; font-weight: 700; text-align: right; font-family: monospace;">${shortHash}</td>
      </tr>
    </table>
  `;

  return {
    subject: `📜 Return Certificate Issued: #${certId} (${itemTitle})`,
    text: `Recovery complete! Your official handover certificate #${certId} has been generated.`,
    html: wrapEmailShell({
      badgeText: '📜 Certificate of Return',
      badgeColor: '#1D4ED8',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      title: 'Handover Completed',
      preheader: `Recovery certificate #${certId} generated for "${itemTitle}".`,
      bodyContent,
      ctaText: 'Download Verified Certificate PDF →',
      ctaUrl: `${BASE_URL}/handover-status`,
    }),
  };
};

/**
 * 14. SMART_TAG_SCANNED — Smart QR/NFC Tag Scanned Alert
 */
export const buildSmartTagScannedTemplate = ({ tagCode, itemTitle = 'Tagged Belonging', scanTime = new Date().toUTCString(), approxLocation = 'University Library 2nd Floor' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Alert! Someone just scanned the Smart QR / NFC Recovery Tag attached to your <strong>${itemTitle}</strong> (Tag Code: <strong>${tagCode}</strong>).
    </p>

    <!-- Scan Telemetry Card -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: left; font-size: 13px;">
      <tr>
        <td style="color: #1E40AF; padding: 5px 0; font-weight: 600;">Scan Event:</td>
        <td style="color: #1D4ED8; font-weight: 800; text-align: right;">PHYSICAL SCAN DETECTED</td>
      </tr>
      <tr>
        <td style="color: #1E40AF; padding: 5px 0; font-weight: 600;">Approx. Location:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${approxLocation}</td>
      </tr>
      <tr>
        <td style="color: #1E40AF; padding: 5px 0; font-weight: 600;">Timestamp:</td>
        <td style="color: #0F1F3D; font-weight: 700; text-align: right;">${scanTime}</td>
      </tr>
    </table>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; text-align: left;">
      <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
        The finder has been provided a secure, zero-knowledge contact window. No private personal phone numbers or emails were disclosed.
      </p>
    </div>
  `;

  return {
    subject: `📍 Smart Tag Scanned! "${itemTitle}" (${tagCode})`,
    text: `Smart tag for "${itemTitle}" was just scanned near ${approxLocation}. Check portal to connect anonymously.`,
    html: wrapEmailShell({
      badgeText: '📡 Proximity Scan Alert',
      badgeColor: '#2563EB',
      badgeBg: '#EFF6FF',
      badgeBorder: '#BFDBFE',
      title: 'Smart Tag Located!',
      preheader: `Your tag ${tagCode} was scanned near ${approxLocation}.`,
      bodyContent,
      ctaText: 'Open Safe Anonymous Chat →',
      ctaUrl: `${BASE_URL}/chat`,
    }),
  };
};

/**
 * 15. OFFICER_VAULT_ALERT — Operations Alert for Unclaimed Aging Items
 */
export const buildOfficerVaultAlertTemplate = ({ agingItemsCount = 3, oldestDays = 28, vaultSection = 'Section B - Electronics' }) => {
  const bodyContent = `
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Attention Campus Security Officer: <strong>${agingItemsCount} items</strong> in <strong>${vaultSection}</strong> have remained unclaimed and are approaching the 30-day statutory retention threshold.
    </p>

    <!-- Alert Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: left; font-size: 13px;">
      <tr>
        <td style="color: #92400E; padding: 5px 0; font-weight: 600;">Aging Inventory:</td>
        <td style="color: #B45309; font-weight: 800; text-align: right;">${agingItemsCount} Items Pending</td>
      </tr>
      <tr>
        <td style="color: #92400E; padding: 5px 0; font-weight: 600;">Oldest Custody:</td>
        <td style="color: #B45309; font-weight: 800; text-align: right;">${oldestDays} Days in Vault</td>
      </tr>
      <tr>
        <td style="color: #92400E; padding: 5px 0; font-weight: 600;">Statutory Action:</td>
        <td style="color: #DC2626; font-weight: 700; text-align: right;">Archival / Escrow Escalation</td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
      Please inspect the vault manifest and initiate final claimant notifications before legal archival transitions.
    </p>
  `;

  return {
    subject: `🚨 Operations Alert: ${agingItemsCount} Vault Items Approaching Expiry`,
    text: `Notice: ${agingItemsCount} items in ${vaultSection} are approaching 30 days custody. Review manifest now.`,
    html: wrapEmailShell({
      badgeText: '🏛️ Vault Operations Alert',
      badgeColor: '#D97706',
      badgeBg: '#FFFBEB',
      badgeBorder: '#FDE68A',
      title: 'Custody Expiry Warning',
      preheader: `${agingItemsCount} items in ${vaultSection} require officer review.`,
      bodyContent,
      ctaText: 'Open Officer Vault Console →',
      ctaUrl: `${BASE_URL}/authority-handover`,
    }),
  };
};

/**
 * Universal Template Builder Dispatcher
 */
export const buildFeatureEmail = (templateType, data = {}) => {
  switch (templateType) {
    case 'AUTH_OTP':
      return buildAuthOtpTemplate(data.code || data);
    case 'WELCOME_USER':
      return buildWelcomeTemplate(data);
    case 'PASSWORD_RESET':
      return buildPasswordResetTemplate(data);
    case 'SECURITY_ALERT':
      return buildSecurityAlertTemplate(data);
    case 'REPORT_LOST_CONFIRMATION':
      return buildReportLostConfirmationTemplate(data);
    case 'REPORT_FOUND_CONFIRMATION':
      return buildReportFoundConfirmationTemplate(data);
    case 'AI_MATCH_FOUND':
      return buildAiMatchFoundTemplate(data);
    case 'CLAIM_SUBMITTED':
      return buildClaimSubmittedTemplate(data);
    case 'CLAIM_EVIDENCE_REQUESTED':
      return buildEvidenceRequestedTemplate(data);
    case 'CLAIM_APPROVED':
      return buildClaimApprovedTemplate(data);
    case 'CLAIM_REJECTED':
      return buildClaimRejectedTemplate(data);
    case 'HANDOVER_PASSCODE':
      return buildHandoverPasscodeTemplate(data);
    case 'HANDOVER_CERTIFICATE':
      return buildHandoverCertificateTemplate(data);
    case 'SMART_TAG_SCANNED':
      return buildSmartTagScannedTemplate(data);
    case 'OFFICER_VAULT_ALERT':
      return buildOfficerVaultAlertTemplate(data);
    default:
      throw new Error(`Unknown email template type: "${templateType}"`);
  }
};
