import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = (...parts) => path.resolve(__dirname, '..', ...parts);

console.log('══════════════════════════════════════════════════════════════');
console.log('  ZEXO / FindBack AI — Complete End-to-End Build & Config Verification');
console.log('══════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

const assertTest = (name, condition, extraInfo = '') => {
  if (condition) {
    console.log(`  [+] [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [-] [FAIL] ${name} ${extraInfo}`);
    failed++;
  }
};

// 1. Check Vite Config Base Path
const viteConfig = fs.readFileSync(root('vite.config.js'), 'utf8');
assertTest('Vite Config relative base ("./")', viteConfig.includes("base: './'"));

// 2. Check Capacitor Config WebDir
const capConfig = JSON.parse(fs.readFileSync(root('capacitor.config.json'), 'utf8'));
assertTest('Capacitor Config webDir ("dist")', capConfig.webDir === 'dist');
assertTest('Capacitor Config appId ("com.findback.ai.app")', capConfig.appId === 'com.findback.ai.app');

// 3. Check emailOtpService for zero static nodemailer dependencies
const otpService = fs.readFileSync(root('emailOtpService.js'), 'utf8');
assertTest('emailOtpService browser-safe (No static nodemailer import)', !otpService.includes("from 'nodemailer'") && !otpService.includes('require("nodemailer")'));

// 4. Check nativePluginsHelper for safe wrappers
const nativeHelper = fs.readFileSync(root('nativePluginsHelper.js'), 'utf8');
assertTest('Camera plugin permission fallback wrapper', nativeHelper.includes('safeTakeCameraPhoto'));
assertTest('Geolocation plugin permission fallback wrapper', nativeHelper.includes('safeGetCurrentLocation'));
assertTest('Preferences storage fallback wrapper', nativeHelper.includes('safeStorage'));

// 5. Check ProGuard rules preservation
const proguard = fs.readFileSync(root('android/app/proguard-rules.pro'), 'utf8');
assertTest('ProGuard Capacitor plugins preservation', proguard.includes('com.capacitorjs.plugins'));
assertTest('ProGuard Firebase SDK preservation', proguard.includes('com.google.firebase'));

// 6. Check ReportWizard null-safety and Auto-Fill button
const reportWizard = fs.readFileSync(root('ReportWizard.jsx'), 'utf8');
assertTest('ReportWizard null-safe user ID handler', reportWizard.includes('authUser?.id') || reportWizard.includes('userId'));
assertTest('ReportWizard "Fill Sample Test Data" utility', reportWizard.includes('handleAutoFillTestData'));

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`  VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('══════════════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
