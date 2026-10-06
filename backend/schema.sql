-- ============================================================================
-- FindBack AI Enterprise — PostgreSQL Production Schema (Supabase / Render / Neon)
-- ============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT 'Zero@123',
    security_key VARCHAR(64) DEFAULT 'SEC123',
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(32) DEFAULT 'user',
    account_status VARCHAR(32) DEFAULT 'active',
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lost Reports Table
CREATE TABLE IF NOT EXISTS lost_reports (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    brand VARCHAR(128),
    color VARCHAR(64),
    distinguishing_marks TEXT,
    location_text TEXT,
    location_lat NUMERIC(10, 6),
    location_lng NUMERIC(10, 6),
    reporter_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    lost_date DATE,
    lost_time VARCHAR(32),
    status VARCHAR(32) DEFAULT 'active',
    storage_location TEXT DEFAULT 'Vault A - Central Database Storage',
    owner_response_status VARCHAR(64) DEFAULT 'awaiting_response',
    owner_notified_at TIMESTAMPTZ,
    owner_response_deadline TIMESTAMPTZ,
    retention_until TIMESTAMPTZ,
    ai_tags JSONB DEFAULT '[]'::jsonb,
    ai_confidence NUMERIC(5, 2) DEFAULT 0,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ
);

-- 3. Found Reports Table
CREATE TABLE IF NOT EXISTS found_reports (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    brand VARCHAR(128),
    color VARCHAR(64),
    distinguishing_marks TEXT,
    location_text TEXT,
    location_lat NUMERIC(10, 6),
    location_lng NUMERIC(10, 6),
    finder_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    current_holder_location TEXT,
    found_date DATE,
    found_time VARCHAR(32),
    status VARCHAR(32) DEFAULT 'active',
    storage_location TEXT DEFAULT 'Vault B - Secure Physical Depot',
    owner_response_status VARCHAR(64) DEFAULT 'awaiting_response',
    owner_notified_at TIMESTAMPTZ,
    owner_response_deadline TIMESTAMPTZ,
    retention_until TIMESTAMPTZ,
    ai_tags JSONB DEFAULT '[]'::jsonb,
    ai_confidence NUMERIC(5, 2) DEFAULT 0,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ
);

-- 4. AI Matches Table
CREATE TABLE IF NOT EXISTS ai_matches (
    id VARCHAR(128) PRIMARY KEY,
    lost_report_id VARCHAR(128) REFERENCES lost_reports(id) ON DELETE CASCADE,
    found_report_id VARCHAR(128) REFERENCES found_reports(id) ON DELETE CASCADE,
    overall_confidence_score NUMERIC(5, 2) DEFAULT 0,
    overall_score NUMERIC(5, 2) DEFAULT 0,
    text_similarity_score NUMERIC(5, 2) DEFAULT 0,
    image_similarity_score NUMERIC(5, 2) DEFAULT 0,
    category_match_score NUMERIC(5, 2) DEFAULT 0,
    location_proximity_score NUMERIC(5, 2) DEFAULT 0,
    time_proximity_score NUMERIC(5, 2) DEFAULT 0,
    spatial_proximity_km NUMERIC(10, 4),
    temporal_proximity_hours NUMERIC(10, 2),
    status VARCHAR(32) DEFAULT 'suggested',
    ai_recommendation TEXT,
    match_reasons JSONB DEFAULT '[]'::jsonb,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(128) PRIMARY KEY,
    match_id VARCHAR(128) REFERENCES ai_matches(id) ON DELETE SET NULL,
    lost_report_id VARCHAR(128) REFERENCES lost_reports(id) ON DELETE CASCADE,
    found_report_id VARCHAR(128) REFERENCES found_reports(id) ON DELETE CASCADE,
    claimant_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    claimant_notes TEXT,
    review_notes TEXT,
    status VARCHAR(32) DEFAULT 'submitted',
    evidence_score NUMERIC(5, 2) DEFAULT 0,
    verification_hash VARCHAR(128),
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ownership Evidence Table
CREATE TABLE IF NOT EXISTS ownership_evidence (
    id VARCHAR(128) PRIMARY KEY,
    claim_id VARCHAR(128) REFERENCES claims(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    evidence_type VARCHAR(64) DEFAULT 'description',
    text_description TEXT,
    file_url TEXT,
    verified BOOLEAN DEFAULT true,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Handovers Table
CREATE TABLE IF NOT EXISTS handovers (
    id VARCHAR(128) PRIMARY KEY,
    claim_id VARCHAR(128) REFERENCES claims(id) ON DELETE CASCADE,
    cert_id VARCHAR(128),
    item_name VARCHAR(255),
    authority_name VARCHAR(255),
    officer_name VARCHAR(255),
    recipient_email VARCHAR(255),
    signature_hash VARCHAR(128),
    timestamp VARCHAR(64),
    lost_owner_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    found_reporter_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    scheduled_location TEXT,
    scheduled_datetime TIMESTAMPTZ,
    status VARCHAR(32) DEFAULT 'scheduled',
    verification_code VARCHAR(32),
    admin_supervised BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ,
    receipt_hash VARCHAR(128),
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(64),
    related_entity_id VARCHAR(128),
    is_read BOOLEAN DEFAULT false,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Admin Actions (Audit Trail) Table
CREATE TABLE IF NOT EXISTS admin_actions (
    id VARCHAR(128) PRIMARY KEY,
    admin_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(64) NOT NULL,
    target_entity_type VARCHAR(64),
    target_entity_id VARCHAR(128),
    notes TEXT,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. User Auth Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Geospatial and Status Queries
CREATE INDEX IF NOT EXISTS idx_lost_reports_status ON lost_reports(status);
CREATE INDEX IF NOT EXISTS idx_found_reports_status ON found_reports(status);
CREATE INDEX IF NOT EXISTS idx_ai_matches_lost ON ai_matches(lost_report_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_found ON ai_matches(found_report_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON handovers(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
