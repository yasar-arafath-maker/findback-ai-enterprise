/**
 * FindBack AI Enterprise - Backend Database Seeder (ESM)
 * Usage: node seed_db.js or npm run seed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'local_db.json');

const sampleUsers = [
  { id: "user-default-1", email: "user@example.com", full_name: "Demo User", role: "user", account_status: "active", created_date: new Date().toISOString() },
  { id: "admin-default-1", email: "admin@findback.app", full_name: "Admin Supervisor", role: "admin", account_status: "active", created_date: new Date().toISOString() },
  { id: "user-sarah-101", email: "sarah.m@gmail.com", full_name: "Sarah Miller", role: "user", account_status: "active", created_date: new Date().toISOString() },
  { id: "user-anand-103", email: "anand.v@gmail.com", full_name: "Anand Verma", role: "user", account_status: "active", created_date: new Date().toISOString() },
  { id: "user-karthik-105", email: "karthik.r@gmail.com", full_name: "Karthik Raja", role: "user", account_status: "active", created_date: new Date().toISOString() },
  { id: "user-priya-109", email: "priya.k@gmail.com", full_name: "Priya Kumar", role: "user", account_status: "active", created_date: new Date().toISOString() }
];

const sampleLostReports = [
  {
    id: "lost-seed-101",
    title: "MacBook Air M2 (Space Grey) in Leather Sleeve",
    category: "Electronics",
    description: "Space Grey 13-inch MacBook Air M2 in dark brown leather sleeve. Has VS Code sticker near logo.",
    brand: "Apple",
    color: "Space Grey",
    distinguishing_marks: "VS Code sticker on lid; tiny nick on right corner",
    location_text: "KRCT Central Library (2nd Floor Quiet Zone)",
    location_lat: 10.8231,
    location_lng: 78.6942,
    reporter_id: "user-sarah-101",
    lost_date: "2026-08-26",
    lost_time: "14:30",
    status: "active",
    ai_tags: ["MacBook", "Laptop", "Apple", "Space Grey"],
    ai_confidence: 96.5,
    created_date: "2026-08-26T14:30:00.000Z"
  },
  {
    id: "lost-seed-102",
    title: "Apple iPhone 15 Pro Max (Natural Titanium)",
    category: "Electronics",
    description: "Natural Titanium iPhone 15 Pro Max with matte screen protector and subtle blue ring holder.",
    brand: "Apple",
    color: "Natural Titanium",
    distinguishing_marks: "Blue ring kickstand attached to back case",
    location_text: "KRCT Campus Cafeteria (Table 12)",
    location_lat: 10.8238,
    location_lng: 78.6948,
    reporter_id: "user-anand-103",
    lost_date: "2026-08-25",
    lost_time: "12:45",
    status: "active",
    ai_tags: ["iPhone", "Mobile Phone", "Titanium", "Apple"],
    ai_confidence: 94.2,
    created_date: "2026-08-25T12:45:00.000Z"
  },
  {
    id: "lost-seed-103",
    title: "Wildcraft Black Leather Wallet with Student ID",
    category: "Bags",
    description: "Black bi-fold leather wallet containing student ID card, college library card, and driving license.",
    brand: "Wildcraft",
    color: "Black",
    distinguishing_marks: "Scratch mark near inner card slot",
    location_text: "KRCT Sports Complex Basketball Court",
    location_lat: 10.8242,
    location_lng: 78.6952,
    reporter_id: "user-karthik-105",
    lost_date: "2026-08-24",
    lost_time: "17:15",
    status: "active",
    ai_tags: ["Wallet", "Leather", "Wildcraft", "Black"],
    ai_confidence: 91.0,
    created_date: "2026-08-24T17:15:00.000Z"
  }
];

const sampleFoundReports = [
  {
    id: "found-seed-201",
    title: "MacBook Air M2 (Space Grey) found near Library Lounge",
    category: "Electronics",
    description: "Found Space Grey MacBook Air inside brown leather case left on library study desk 4. Turned over to security counter.",
    brand: "Apple",
    color: "Space Grey",
    distinguishing_marks: "VS Code sticker on lid",
    location_text: "KRCT Central Library Study Lounge",
    location_lat: 10.8232,
    location_lng: 78.6943,
    finder_id: "user-priya-109",
    current_holder_location: "Central Library Security Desk Counter #1",
    found_date: "2026-08-26",
    found_time: "15:00",
    status: "active",
    ai_tags: ["MacBook", "Laptop", "Apple", "Space Grey"],
    ai_confidence: 96.5,
    created_date: "2026-08-26T15:00:00.000Z"
  },
  {
    id: "found-seed-202",
    title: "iPhone 15 Pro Max found at Cafeteria Counter",
    category: "Electronics",
    description: "Found Natural Titanium iPhone 15 Pro with blue ring stand on cafeteria table. Handed to cafe supervisor.",
    brand: "Apple",
    color: "Natural Titanium",
    distinguishing_marks: "Blue ring stand on rear case",
    location_text: "KRCT Campus Cafeteria (Counter 2)",
    location_lat: 10.8239,
    location_lng: 78.6949,
    finder_id: "user-priya-109",
    current_holder_location: "Cafeteria Manager Office",
    found_date: "2026-08-25",
    found_time: "13:10",
    status: "active",
    ai_tags: ["iPhone", "Mobile Phone", "Titanium", "Apple"],
    ai_confidence: 94.2,
    created_date: "2026-08-25T13:10:00.000Z"
  }
];

const sampleAIMatches = [
  {
    id: "match-seed-301",
    lost_report_id: "lost-seed-101",
    found_report_id: "found-seed-201",
    overall_confidence_score: 96.5,
    text_similarity_score: 98.0,
    spatial_proximity_km: 0.015,
    temporal_proximity_hours: 0.5,
    status: "suggested",
    ai_recommendation: "HIGH CONFIDENCE MATCH: Match verified by SimHash text analysis and spatial proximity (15m within Central Library).",
    created_date: "2026-08-26T15:05:00.000Z"
  },
  {
    id: "match-seed-302",
    lost_report_id: "lost-seed-102",
    found_report_id: "found-seed-202",
    overall_confidence_score: 94.2,
    text_similarity_score: 95.0,
    spatial_proximity_km: 0.02,
    temporal_proximity_hours: 0.4,
    status: "suggested",
    ai_recommendation: "HIGH CONFIDENCE MATCH: Titanium iPhone 15 Pro Max matched with blue ring holder signature.",
    created_date: "2026-08-25T13:15:00.000Z"
  }
];

const sampleClaims = [
  {
    id: "claim-seed-401",
    match_id: "match-seed-301",
    claimant_id: "user-sarah-101",
    claimant_notes: "This is my MacBook Air M2. I can unlock it with my fingerprint and password.",
    status: "approved",
    evidence_score: 98.0,
    verification_hash: "0x8F9C2B1D4E3A7F0B",
    created_date: "2026-08-26T16:00:00.000Z"
  }
];

const sampleHandovers = [
  {
    id: "handover-seed-501",
    claim_id: "claim-seed-401",
    cert_id: "ZEXO-CERT-88492015",
    item_name: "MacBook Air M2 (Space Grey)",
    authority_name: "KRCT Central Library Security Desk",
    officer_name: "Inspector R. Sharma (Badge #8839)",
    recipient_email: "sarah.m@gmail.com",
    signature_hash: "0x9E8D7C6B5A4F3E2D",
    timestamp: "2026-08-26 17:30:00",
    created_date: "2026-08-26T17:30:00.000Z"
  }
];

const sampleNotifications = [
  {
    id: "note-seed-601",
    user_id: "user-sarah-101",
    title: "⚡ Smart Geo-Fence Alert",
    message: "A found item (Space Grey MacBook Air) was reported within 500m of your lost location.",
    type: "geo_alert",
    is_read: false,
    created_date: "2026-08-26T15:01:00.000Z"
  }
];

export function seedDatabase() {
  let db = { User: [], LostReports: [], FoundReports: [], AIMatches: [], Claims: [], OwnershipEvidence: [], Handovers: [], Notifications: [], Sessions: {} };

  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {}
  }

  db.User = (db.User && db.User.length >= 2) ? db.User : sampleUsers;
  db.LostReports = (db.LostReports && db.LostReports.length > 0) ? db.LostReports : sampleLostReports;
  db.FoundReports = (db.FoundReports && db.FoundReports.length > 0) ? db.FoundReports : sampleFoundReports;
  db.AIMatches = (db.AIMatches && db.AIMatches.length > 0) ? db.AIMatches : sampleAIMatches;
  db.Claims = (db.Claims && db.Claims.length > 0) ? db.Claims : sampleClaims;
  db.Handovers = (db.Handovers && db.Handovers.length > 0) ? db.Handovers : sampleHandovers;
  db.Notifications = (db.Notifications && db.Notifications.length > 0) ? db.Notifications : sampleNotifications;

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log('✅ [Backend Seeder] Database seeded successfully at:', DB_FILE);
}

seedDatabase();
