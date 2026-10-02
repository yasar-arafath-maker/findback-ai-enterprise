import dotenv from 'dotenv';
dotenv.config();
import { sendOtpEmail, sendFeatureEmail } from './emailOtpService.js';

const targetEmail = 'yasararafath.tech@gmail.com';

async function main() {
  console.log(`Sending single test OTP & Feature email to: ${targetEmail}...`);
  try {
    const res = await sendOtpEmail(targetEmail);
    console.log('OTP Result:', JSON.stringify(res, null, 2));

    const featureRes = await sendFeatureEmail(targetEmail, 'match_found', {
      lostTitle: 'MacBook Pro M2 Silver',
      foundTitle: 'Found Silver Laptop - Library Floor 2',
      confidenceScore: 96,
      category: 'Electronics',
    });
    console.log('Feature Email Result:', JSON.stringify(featureRes, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
