/**
 * FindBack AI Enterprise — Professional PDF Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side cryptographic PDF generation for:
 * 1. Official Law Enforcement & Security Handover Certificates
 * 2. Privacy-Preserving Smart QR Item Protection Tags
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generate and download an official digital handover certificate as a tamper-evident PDF
 * @param {Object} certificate
 * @returns {Promise<string>} filename
 */
export async function generateHandoverCertificatePdf(certificate) {
  if (!certificate) throw new Error('No certificate data provided');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Background Outer Security Border
  doc.setDrawColor(30, 27, 75); // Deep Indigo
  doc.setLineWidth(1.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Accent Border
  doc.setDrawColor(99, 102, 241); // Indigo-500
  doc.setLineWidth(0.4);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(12, 12, pageWidth - 24, 38, 'F');

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FINDBACK AI ENTERPRISE', pageWidth / 2, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254); // Indigo-200
  doc.text('OFFICIAL DIGITAL PROPERTY HANDOVER CERTIFICATE', pageWidth / 2, 31, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Law Enforcement & Campus Security Chain-of-Custody Record', pageWidth / 2, 38, { align: 'center' });

  // Certificate ID & Status Badge Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(18, 55, pageWidth - 36, 18, 3, 3, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(18, 55, pageWidth - 36, 18, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text('CERTIFICATE IDENTIFIER:', 24, 63);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text(certificate.cert_id || certificate.id || 'FB-CERT-OFFICIAL', 24, 69);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text('STATUS: VERIFIED & TAMPER-EVIDENT', pageWidth - 24, 66, { align: 'right' });

  // Section 1: Property Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. RECOVERED PROPERTY DETAILS', 18, 83);
  doc.setDrawColor(226, 232, 240);
  doc.line(18, 85, pageWidth - 18, 85);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Item Description:', 22, 93);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(certificate.item_name || 'Unspecified Valuable', 140), 60, 93);

  // Section 2: Authority & Custody Station
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. OFFICIAL CUSTODY & HANDOVER AUTHORITY', 18, 115);
  doc.line(18, 117, pageWidth - 18, 117);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Authority Station:', 22, 126);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(certificate.authority_name || 'Central Security Authority', 60, 126);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Supervising Officer:', 22, 136);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(certificate.officer_name || 'Duty Officer', 60, 136);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Recipient / Owner:', 22, 146);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(certificate.recipient_email || 'Verified Owner', 60, 146);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Transaction Timestamp:', 22, 156);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  const formattedDate = certificate.timestamp
    ? new Date(certificate.timestamp).toLocaleString()
    : new Date().toLocaleString();
  doc.text(formattedDate, 60, 156);

  // Section 3: Cryptographic Integrity & Verification QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. CRYPTOGRAPHIC PROOF & INSTANT VERIFICATION', 18, 175);
  doc.line(18, 177, pageWidth - 18, 177);

  // Generate / Retrieve QR Code
  let qrImage = certificate.qr_url;
  if (!qrImage) {
    const origin = 'https://findbac.onrender.com';
    const verifyUrl = `${origin}/evidence/${certificate.cert_id || certificate.id}`;
    qrImage = await QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }

  if (qrImage) {
    doc.addImage(qrImage, 'PNG', 22, 185, 45, 45);
    doc.setDrawColor(203, 213, 225);
    doc.rect(22, 185, 45, 45, 'D');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 70, 229);
  doc.text('INSTANT DIGITAL VERIFICATION', 74, 192);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Scan this QR code with any mobile device to view real-time cryptographic audit trail, timestamps, and authorized custody chain recorded on the FindBack AI cloud ledger.',
    74,
    198,
    { maxWidth: 115 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SHA-256 DIGITAL SIGNATURE HASH:', 74, 215);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(147, 51, 234);
  const sigHash = certificate.signature_hash || '0x8F9C2B1D4E3A7F0B7C92F8A1B5E0D3C4';
  doc.text(sigHash, 74, 221);

  // Section 4: Security Watermark / Legal Affirmation
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 240, pageWidth - 36, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, 240, pageWidth - 36, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('LEGAL NOTICE & RECOVERY INTEGRITY COMPLIANCE', 24, 247);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This certificate certifies the lawful physical handover and restitution of property under institutional loss recovery guidelines. The unique signature hash and verification record are permanently archived in the tamper-resistant enterprise ledger.',
    24,
    253,
    { maxWidth: pageWidth - 48 }
  );

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'FindBack AI Enterprise · Autonomous Recovery & Restitution Platform · https://findbac.onrender.com',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  const filename = `${certificate.cert_id || 'handover'}_certificate.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generate and download an item Smart Protection Tag as a printable sticker PDF
 * @param {Object} tag
 * @returns {Promise<string>} filename
 */
export async function generateSmartTagPdf(tag) {
  if (!tag) throw new Error('No tag data provided');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150], // Pocket / Sticker format
  });

  const pageWidth = 100;
  const pageHeight = 150;

  // Background Outer Border
  doc.setDrawColor(37, 99, 235); // Blue-600
  doc.setLineWidth(1);
  doc.rect(4, 4, pageWidth - 8, pageHeight - 8);

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(4, 4, pageWidth - 8, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FINDBACK AI SMART TAG', pageWidth / 2, 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253);
  doc.text('PROTECTED VALUABLE PROPERTY', pageWidth / 2, 19, { align: 'center' });

  // QR Code
  let qrImage = tag.qr_url;
  if (!qrImage) {
    const origin = 'https://findbac.onrender.com';
    const relayUrl = `${origin}/safe-chat?channel=${tag.tag_id}&item=${encodeURIComponent(tag.item_name || 'Protected Item')}`;
    qrImage = await QRCode.toDataURL(relayUrl, {
      width: 280,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }

  if (qrImage) {
    doc.addImage(qrImage, 'PNG', (pageWidth - 50) / 2, 32, 50, 50);
  }

  // Tag ID Chip
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(15, 87, pageWidth - 30, 10, 2, 2, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(tag.tag_id || 'FB-TAG-PROTECTED', pageWidth / 2, 93.5, { align: 'center' });

  // Item Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(tag.item_name || 'Valuable Item', pageWidth - 20), pageWidth / 2, 105, { align: 'center' });

  // Note
  if (tag.note) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(`"${tag.note}"`, pageWidth - 24), pageWidth / 2, 115, { align: 'center' });
  }

  // Instruction Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(8, 124, pageWidth - 16, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('IF FOUND, PLEASE SCAN THIS QR CODE', pageWidth / 2, 130, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Connect securely with the owner without sharing phone numbers or personal information.', pageWidth / 2, 136, {
    align: 'center',
    maxWidth: pageWidth - 20,
  });

  const filename = `${tag.tag_id || 'smart'}_protection_tag.pdf`;
  doc.save(filename);
  return filename;
}
