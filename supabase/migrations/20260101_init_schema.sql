-- ==============================================================================
-- E-PILKETOS SMKN 4 KOTA SERANG
-- Database Schema & Security Architecture
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ELECTION SETTINGS
CREATE TABLE IF NOT EXISTS election_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    title TEXT NOT NULL DEFAULT 'E-PILKETOS SMKN 4 KOTA SERANG',
    school_name TEXT NOT NULL DEFAULT 'SMKN 4 Kota Serang',
    period_name TEXT NOT NULL DEFAULT 'Masa Bakti 2026/2027',
    status TEXT NOT NULL CHECK (status IN ('not_started', 'ongoing', 'closed')) DEFAULT 'not_started',
    is_results_published BOOLEAN NOT NULL DEFAULT FALSE,
    results_published_at TIMESTAMPTZ,
    results_published_by TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('ketua', 'wakil')),
    candidate_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    grade_major TEXT NOT NULL,
    tagline TEXT,
    photo_url TEXT,
    vision TEXT NOT NULL,
    missions TEXT[] NOT NULL DEFAULT '{}',
    programs TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES (Voter Quota & Aggregate Turnout)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    grade TEXT NOT NULL CHECK (grade IN ('10', '11')),
    major TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    voter_quota INTEGER NOT NULL DEFAULT 36,
    tokens_generated INTEGER NOT NULL DEFAULT 0,
    voted_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TOKEN BATCHES
CREATE TABLE IF NOT EXISTS token_batches (
    id TEXT PRIMARY KEY,
    batch_name TEXT NOT NULL,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    total_tokens INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VOTING TOKENS (Hashed storage for security)
CREATE TABLE IF NOT EXISTS voting_tokens (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    token_preview TEXT NOT NULL,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES token_batches(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'used', 'revoked')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    replacement_token_id TEXT
);

-- Index for O(1) token hash lookups
CREATE INDEX IF NOT EXISTS idx_voting_tokens_hash ON voting_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_voting_tokens_status ON voting_tokens(status);
CREATE INDEX IF NOT EXISTS idx_voting_tokens_class ON voting_tokens(class_id);

-- 6. ANONYMOUS BALLOTS
-- CRITICAL FOR BALLOT SECRECY:
-- No token_id, no student_id, no IP address, no class_id reference.
CREATE TABLE IF NOT EXISTS ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_ketua_id TEXT NOT NULL REFERENCES candidates(id),
    candidate_wakil_id TEXT NOT NULL REFERENCES candidates(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    ip_address TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE election_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- election_settings: Everyone can read public settings; only authenticated service role can edit
CREATE POLICY "Public read election_settings" ON election_settings FOR SELECT USING (true);

-- candidates: Everyone can read active candidates
CREATE POLICY "Public read active candidates" ON candidates FOR SELECT USING (is_active = true);

-- classes: Everyone can read aggregate statistics
CREATE POLICY "Public read classes" ON classes FOR SELECT USING (true);

-- voting_tokens: NO direct public select, insert, or update.
-- Tokens can ONLY be queried/updated via SECURITY DEFINER functions or service role!
CREATE POLICY "Deny all public on voting_tokens" ON voting_tokens FOR ALL USING (false);

-- ballots: NO direct public insert or select.
-- Ballots can ONLY be inserted via atomic cast_vote RPC!
CREATE POLICY "Deny direct public select ballots" ON ballots FOR SELECT USING (false);

-- audit_logs: Only admin / service role
CREATE POLICY "Deny direct public on audit_logs" ON audit_logs FOR ALL USING (false);

-- ==============================================================================
-- ATOMIC RPC FUNCTION: cast_vote
-- Performs verification, token consumption, class counter update, and ballot insert
-- in a single atomic transaction.
-- ==============================================================================

CREATE OR REPLACE FUNCTION cast_vote(
    p_token_hash TEXT,
    p_candidate_ketua_id TEXT,
    p_candidate_wakil_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_election_status TEXT;
    v_token_id TEXT;
    v_token_status TEXT;
    v_class_id TEXT;
    v_ketua_valid BOOLEAN;
    v_wakil_valid BOOLEAN;
BEGIN
    -- 1. Check election status
    SELECT status INTO v_election_status FROM election_settings WHERE id = 'default';
    IF v_election_status IS NULL OR v_election_status != 'ongoing' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesi pemilihan saat ini sedang tidak dibuka.');
    END IF;

    -- 2. Validate token
    SELECT id, status, class_id INTO v_token_id, v_token_status, v_class_id
    FROM voting_tokens
    WHERE token_hash = p_token_hash
    FOR UPDATE; -- Row-level lock to prevent race conditions / double voting

    IF v_token_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token pemilihan tidak valid atau tidak terdaftar.');
    END IF;

    IF v_token_status = 'revoked' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token ini telah dibatalkan oleh panitia.');
    END IF;

    IF v_token_status = 'used' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token ini telah digunakan untuk memilih.');
    END IF;

    -- 3. Validate Ketua Candidate
    SELECT EXISTS (
        SELECT 1 FROM candidates 
        WHERE id = p_candidate_ketua_id AND type = 'ketua' AND is_active = true
    ) INTO v_ketua_valid;

    IF NOT v_ketua_valid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pilihan Calon Ketua OSIS tidak valid.');
    END IF;

    -- 4. Validate Wakil Candidate
    SELECT EXISTS (
        SELECT 1 FROM candidates 
        WHERE id = p_candidate_wakil_id AND type = 'wakil' AND is_active = true
    ) INTO v_wakil_valid;

    IF NOT v_wakil_valid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pilihan Calon Wakil Ketua OSIS tidak valid.');
    END IF;

    -- 5. Mark token as used
    UPDATE voting_tokens
    SET status = 'used', used_at = NOW()
    WHERE id = v_token_id;

    -- 6. Atomically update class aggregate turnout
    UPDATE classes
    SET voted_count = voted_count + 1, updated_at = NOW()
    WHERE id = v_class_id;

    -- 7. Insert anonymous ballot (NO reference to token)
    INSERT INTO ballots (candidate_ketua_id, candidate_wakil_id, created_at)
    VALUES (p_candidate_ketua_id, p_candidate_wakil_id, NOW());

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Suaramu telah berhasil dicatat secara sah dan rahasia.',
        'timestamp', NOW()
    );
END;
$$;
