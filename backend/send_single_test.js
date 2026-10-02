import dotenv from 'dotenv';
dotenv.config();
import { sendOtpEmail, sendFeatureEmail } from './emailOtpService.js';

const targetEmail = 'yasararafath.tech@gmail.com';

async function main() {
  console.log(`Sending single test OTP email to: ${targetEmail}...`);
  try {
    const res = await sendOtpEmail(targetEmail);
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
