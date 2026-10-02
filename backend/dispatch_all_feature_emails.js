import dotenv from 'dotenv';
dotenv.config();
import { sendOtpEmail, sendFeatureEmail } from './emailOtpService.js';

const targetEmail = 'yasararafath.tech@gmail.com';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const emailJobs = [
  // 1. Auth OTP
  {
    type: 'AUTH_OTP',
    name: '1. Two-Factor Authentication Passcode (OTP)',
    action: () => sendOtpEmail(targetEmail),
  },
  // 2. Welcome
  {
    type: 'WELCOME_USER',
    name: '2. Welcome & Account Activation',
    action: () =>
      sendFeatureEmail(targetEmail, 'WELCOME_USER', {
        name: 'Enterprise Officer Orion',
        email: targetEmail,
        role: 'officer',
      }),
  },
  // 3. Password Reset
  {
    type: 'PASSWORD_RESET',
    name: '3. Cryptographic Password Reset',
    action: () =>
      sendFeatureEmail(targetEmail, 'PASSWORD_RESET', {
        email: targetEmail,
        resetToken: 'sec_tok_994812',
      }),
  },
  // 4. Security Alert
  {
    type: 'SECURITY_ALERT',
    name: '4. Security Incident Alert (New Device)',
    action: () =>
      sendFeatureEmail(targetEmail, 'SECURITY_ALERT', {
        email: targetEmail,
        ipAddress: '157.48.92.10',
        device: 'Chrome on Windows 11',
        location: 'Bengaluru, India',
        time: new Date().toUTCString(),
      }),
  },
  // 5. Lost Report Confirmation
  {
    type: 'REPORT_LOST_CONFIRMATION',
    name: '5. Lost Property Incident Filed',
    action: () =>
      sendFeatureEmail(targetEmail, 'REPORT_LOST_CONFIRMATION', {
        reportId: 'LST-9912',
        title: 'Apple MacBook Pro 16" Space Black',
        category: 'Electronics',
        dateLost: 'Oct 02, 2026',
        location: 'Engineering Library Floor 2',
      }),
  },
  // 6. Found Report Confirmation
  {
    type: 'REPORT_FOUND_CONFIRMATION',
    name: '6. Found Property Registered in Vault',
    action: () =>
      sendFeatureEmail(targetEmail, 'REPORT_FOUND_CONFIRMATION', {
        reportId: 'FND-4421',
        title: 'Leather Wallet with University Cards',
        category: 'Personal Belongings',
        vaultLocker: 'Vault Desk #2, Locker 14-B',
      }),
  },
  // 7. AI Match Alert
  {
    type: 'AI_MATCH_FOUND',
    name: '7. AI Vision & Proximity Match Alert',
    action: () =>
      sendFeatureEmail(targetEmail, 'AI_MATCH_FOUND', {
        matchId: 'match-ai-8831',
        lostTitle: 'Apple MacBook Pro 16" Space Black',
        foundTitle: 'MacBook Pro in Dark Sleeve Case',
        confidenceScore: 94,
        locationProximity: 'Within 25 meters (Exact Wing)',
      }),
  },
  // 8. Claim Submitted
  {
    type: 'CLAIM_SUBMITTED',
    name: '8. Ownership Claim Received',
    action: () =>
      sendFeatureEmail(targetEmail, 'CLAIM_SUBMITTED', {
        claimId: 'CLM-5591',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        evidenceCount: 2,
      }),
  },
  // 9. Claim Evidence Requested
  {
    type: 'CLAIM_EVIDENCE_REQUESTED',
    name: '9. Additional Evidence Requested by Officer',
    action: () =>
      sendFeatureEmail(targetEmail, 'CLAIM_EVIDENCE_REQUESTED', {
        claimId: 'CLM-5591',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        officerNotes: 'Please upload serial number or purchase invoice to confirm ownership.',
      }),
  },
  // 10. Claim Approved
  {
    type: 'CLAIM_APPROVED',
    name: '10. Claim Approved for Handover',
    action: () =>
      sendFeatureEmail(targetEmail, 'CLAIM_APPROVED', {
        claimId: 'CLM-5591',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        pickupLocation: 'Central Campus Security Desk 1',
        pickupHours: '09:00 AM – 06:00 PM',
      }),
  },
  // 11. Claim Rejected
  {
    type: 'CLAIM_REJECTED',
    name: '11. Claim Review Status Update (Declined)',
    action: () =>
      sendFeatureEmail(targetEmail, 'CLAIM_REJECTED', {
        claimId: 'CLM-5591',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        reasonNotes: 'Serial number submitted did not match vault hardware inspection.',
      }),
  },
  // 12. Handover Passcode
  {
    type: 'HANDOVER_PASSCODE',
    name: '12. Item Handover Release Passcode',
    action: () =>
      sendFeatureEmail(targetEmail, 'HANDOVER_PASSCODE', {
        verificationCode: '749201',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        handoverDesk: 'Central Campus Security Desk 1',
      }),
  },
  // 13. Handover Certificate
  {
    type: 'HANDOVER_CERTIFICATE',
    name: '13. Digital Certificate of Return & Receipt',
    action: () =>
      sendFeatureEmail(targetEmail, 'HANDOVER_CERTIFICATE', {
        certId: 'ZEXO-CERT-2026-9941',
        itemTitle: 'Apple MacBook Pro 16" Space Black',
        receiptHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        completedAt: 'Oct 02, 2026 11:55 AM UTC',
        officerBadge: 'CAMPUS-OFFICER-742',
      }),
  },
  // 14. Smart Tag Scanned
  {
    type: 'SMART_TAG_SCANNED',
    name: '14. Smart NFC / QR Tag Scanned Alert',
    action: () =>
      sendFeatureEmail(targetEmail, 'SMART_TAG_SCANNED', {
        tagCode: 'TAG-ORION-991',
        itemTitle: 'Leather Laptop Backpack',
        scanTime: 'Oct 02, 2026 11:54 AM',
        approxLocation: 'Campus Quad, Near Fountain Plaza',
      }),
  },
  // 15. Officer Vault Alert
  {
    type: 'OFFICER_VAULT_ALERT',
    name: '15. Officer Operations Alert (Aging Inventory)',
    action: () =>
      sendFeatureEmail(targetEmail, 'OFFICER_VAULT_ALERT', {
        agingItemsCount: 4,
        oldestDays: 29,
        vaultSection: 'Central Security Vault - High Value Electronics',
      }),
  },
];

async function dispatchAll() {
  console.log(`\n============================================================`);
  console.log(`  FindBack AI Enterprise — Live Email Dispatch Suite`);
  console.log(`  Recipient: ${targetEmail}`);
  console.log(`  Total Emails to Send: ${emailJobs.length}`);
  console.log(`============================================================\n`);

  const results = [];

  for (let i = 0; i < emailJobs.length; i++) {
    const job = emailJobs[i];
    console.log(`[${i + 1}/${emailJobs.length}] Dispatching: ${job.name}...`);
    try {
      const res = await job.action();
      console.log(`  -> SUCCESS! Message ID: ${res.messageId || 'SENT'} via ${res.dispatchMethod || 'brevo'}`);
      results.push({ index: i + 1, name: job.name, status: 'SUCCESS', messageId: res.messageId, method: res.dispatchMethod });
    } catch (err) {
      console.error(`  -> ERROR:`, err.message);
      results.push({ index: i + 1, name: job.name, status: 'FAILED', error: err.message });
    }
    // Brief breather between SMTP relay transactions
    await sleep(750);
  }

  console.log(`\n============================================================`);
  console.log(`  FINAL DISPATCH SUMMARY`);
  console.log(`  Total Sent: ${results.filter((r) => r.status === 'SUCCESS').length} / ${results.length}`);
  console.log(`============================================================\n`);
  console.log(JSON.stringify(results, null, 2));
}

dispatchAll();
