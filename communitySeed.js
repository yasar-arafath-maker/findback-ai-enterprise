/**
 * ZEXO / FindBack AI — Realistic Mock Data & Global Community Feed Seeder
 * Populates realistic public Lost & Found reports, active AI matches, and notifications
 * to ensure the application presents a live, high-traffic operational platform.
 */

const SEED_KEY = 'zexo_community_seeded_v2';

export const seedInitialCommunityData = () => {
  try {
    if (typeof localStorage === 'undefined') return;

    // Check if already seeded
    if (localStorage.getItem(SEED_KEY)) return;

    const existingLost = JSON.parse(localStorage.getItem('entity_LostReports') || '[]');
    const existingFound = JSON.parse(localStorage.getItem('entity_FoundReports') || '[]');
    const existingMatches = JSON.parse(localStorage.getItem('entity_AIMatches') || '[]');
    const existingNotes = JSON.parse(localStorage.getItem('entity_Notifications') || '[]');

    const seedLost = [
      {
        id: 'lost-seed-101',
        title: 'MacBook Air M2 (Space Grey) in Leather Sleeve',
        category: 'Electronics',
        description: 'Space Grey 13-inch MacBook Air M2 in dark brown leather sleeve. Has small sticker of VS Code on the back.',
        brand: 'Apple',
        color: 'Space Grey',
        distinguishing_marks: 'VS Code sticker near Apple logo',
        location_text: 'KRCT Central Library (2nd Floor Quiet Zone)',
        location_lat: 10.8231,
        location_lng: 78.6942,
        reporter_id: 'user-sarah-101',
        lost_date: '2026-08-26',
        lost_time: '14:30',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'lost-seed-102',
        title: 'Apple iPhone 15 Pro Max (Natural Titanium)',
        category: 'Electronics',
        description: 'Natural Titanium iPhone 15 Pro Max with matte screen protector and subtle blue ring holder.',
        brand: 'Apple',
        color: 'Natural Titanium',
        distinguishing_marks: 'Blue ring kickstand attached to back case',
        location_text: 'KRCT Campus Cafeteria (Table 12)',
        location_lat: 10.8238,
        location_lng: 78.6948,
        reporter_id: 'user-anand-103',
        lost_date: '2026-08-25',
        lost_time: '12:45',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'lost-seed-103',
        title: 'Wildcraft Black Leather Wallet with Student ID',
        category: 'Bags',
        description: 'Black bi-fold leather wallet containing student ID card, college library card, and driving license.',
        brand: 'Wildcraft',
        color: 'Black',
        distinguishing_marks: 'Scratch mark near inner card slot',
        location_text: 'KRCT Sports Complex Basketball Court',
        location_lat: 10.8242,
        location_lng: 78.6952,
        reporter_id: 'user-karthik-105',
        lost_date: '2026-08-24',
        lost_time: '17:15',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
      {
        id: 'lost-seed-104',
        title: 'Royal Enfield Motorcycle Keys on Blue Lanyard',
        category: 'Keys',
        description: 'Single Royal Enfield ignition key attached to a navy blue woven lanyard with brass key ring.',
        brand: 'Royal Enfield',
        color: 'Silver / Blue Lanyard',
        distinguishing_marks: 'Royal Enfield emblem etched on black rubber cap',
        location_text: 'Campus Main Gate Parking Zone B',
        location_lat: 10.8225,
        location_lng: 78.6935,
        reporter_id: 'user-vikram-107',
        lost_date: '2026-08-23',
        lost_time: '09:10',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 96).toISOString(),
      },
    ];

    const seedFound = [
      {
        id: 'found-seed-201',
        title: 'MacBook Air M2 (Space Grey) found near Library Lounge',
        category: 'Electronics',
        description: 'Found Space Grey MacBook Air inside brown leather case left on library desk. Turned over to desk.',
        brand: 'Apple',
        color: 'Space Grey',
        location_text: 'KRCT Central Library Study Lounge',
        location_lat: 10.8232,
        location_lng: 78.6943,
        current_holder_location: 'Central Library Help Desk',
        finder_id: 'user-rahul-202',
        found_date: '2026-08-26',
        found_time: '15:00',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 22).toISOString(),
      },
      {
        id: 'found-seed-202',
        title: 'iPhone 15 Pro Titanium in Clear Case',
        category: 'Electronics',
        description: 'Found Natural Titanium iPhone in clear case near cafeteria tray disposal counter.',
        brand: 'Apple',
        color: 'Natural Titanium',
        location_text: 'KRCT Cafeteria Counter',
        location_lat: 10.8239,
        location_lng: 78.6949,
        current_holder_location: 'Cafeteria Manager Office',
        finder_id: 'user-priya-204',
        found_date: '2026-08-25',
        found_time: '13:00',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 46).toISOString(),
      },
      {
        id: 'found-seed-203',
        title: 'Black Wildcraft Leather Wallet found on bleachers',
        category: 'Bags',
        description: 'Black leather wallet found under bleachers. Contains student cards.',
        brand: 'Wildcraft',
        color: 'Black',
        location_text: 'KRCT Sports Complex Bleachers',
        location_lat: 10.8243,
        location_lng: 78.6953,
        current_holder_location: 'Sports Department Office',
        finder_id: 'user-deepa-206',
        found_date: '2026-08-24',
        found_time: '18:00',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 70).toISOString(),
      },
      {
        id: 'found-seed-204',
        title: 'Single Motorcycle Key with Royal Enfield Emblem',
        category: 'Keys',
        description: 'Found bike key with blue lanyard near main gate security cabin.',
        brand: 'Royal Enfield',
        color: 'Silver / Blue Lanyard',
        location_text: 'Campus Main Gate Security Cabin',
        location_lat: 10.8226,
        location_lng: 78.6936,
        current_holder_location: 'Main Gate Security Office',
        finder_id: 'user-security-208',
        found_date: '2026-08-23',
        found_time: '09:30',
        status: 'active',
        created_date: new Date(Date.now() - 3600000 * 94).toISOString(),
      },
    ];

    const seedMatches = [
      {
        id: 'match-seed-301',
        lost_report_id: 'lost-seed-101',
        found_report_id: 'found-seed-201',
        overall_score: 94,
        text_similarity_score: 92,
        image_similarity_score: 90,
        category_match_score: 100,
        location_proximity_score: 90,
        time_proximity_score: 95,
        status: 'pending_review',
        match_reasons: [
          'High Text SimHash Overlap (92%)',
          'Exact Category Match: Electronics (100%)',
          'Geospatial Proximity: KRCT Central Library (90%)',
          'Same-Day Incident Date: 2026-08-26',
        ],
        created_date: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: 'match-seed-302',
        lost_report_id: 'lost-seed-102',
        found_report_id: 'found-seed-202',
        overall_score: 89,
        text_similarity_score: 88,
        image_similarity_score: 85,
        category_match_score: 100,
        location_proximity_score: 90,
        time_proximity_score: 90,
        status: 'pending_review',
        match_reasons: [
          'Strong Model & Brand Match: Apple iPhone 15 Pro',
          'Exact Category Match: Electronics (100%)',
          'Geospatial Proximity: KRCT Cafeteria (90%)',
        ],
        created_date: new Date(Date.now() - 3600000 * 44).toISOString(),
      },
      {
        id: 'match-seed-303',
        lost_report_id: 'lost-seed-103',
        found_report_id: 'found-seed-203',
        overall_score: 86,
        text_similarity_score: 85,
        image_similarity_score: 80,
        category_match_score: 100,
        location_proximity_score: 85,
        time_proximity_score: 88,
        status: 'pending_review',
        match_reasons: [
          'Brand & Material Match: Wildcraft Black Leather Wallet',
          'Geospatial Proximity: KRCT Sports Complex',
        ],
        created_date: new Date(Date.now() - 3600000 * 68).toISOString(),
      },
      {
        id: 'match-seed-304',
        lost_report_id: 'lost-seed-104',
        found_report_id: 'found-seed-204',
        overall_score: 82,
        text_similarity_score: 80,
        image_similarity_score: 78,
        category_match_score: 100,
        location_proximity_score: 85,
        time_proximity_score: 80,
        status: 'pending_review',
        match_reasons: [
          'Key Lanyard & Emblem Match: Royal Enfield Blue Lanyard',
          'Geospatial Proximity: Main Gate Security Zone',
        ],
        created_date: new Date(Date.now() - 3600000 * 92).toISOString(),
      },
    ];

    const seedNotes = [
      {
        id: 'note-seed-401',
        user_id: 'guest-user',
        type: 'match_alert',
        title: 'New High-Confidence AI Match Discovered',
        message: 'A 94% confidence match was found for MacBook Air M2 near KRCT Central Library.',
        related_entity_type: 'AIMatches',
        related_entity_id: 'match-seed-301',
        is_read: false,
        created_date: new Date().toISOString(),
      },
      {
        id: 'note-seed-402',
        user_id: 'guest-user',
        type: 'system',
        title: 'ZEXO Secure Verification Active',
        message: 'Your lost and found community network is active. Submit ownership proof to trigger supervised handovers.',
        related_entity_type: 'System',
        related_entity_id: 'sys-01',
        is_read: false,
        created_date: new Date(Date.now() - 1800000).toISOString(),
      },
    ];

    // Combine while preserving user-submitted items
    const mergeUnique = (existing, seed) => {
      const ids = new Set(existing.map(x => x.id));
      const filteredSeed = seed.filter(x => !ids.has(x.id));
      return [...existing, ...filteredSeed];
    };

    localStorage.setItem('entity_LostReports', JSON.stringify(mergeUnique(existingLost, seedLost)));
    localStorage.setItem('entity_FoundReports', JSON.stringify(mergeUnique(existingFound, seedFound)));
    localStorage.setItem('entity_AIMatches', JSON.stringify(mergeUnique(existingMatches, seedMatches)));
    localStorage.setItem('entity_Notifications', JSON.stringify(mergeUnique(existingNotes, seedNotes)));

    localStorage.setItem(SEED_KEY, 'true');
    console.log('[Community Seeder] Successfully seeded community reports, AI matches, and notifications.');
  } catch (err) {
    console.warn('[Community Seeder] Notice:', err.message);
  }
};
