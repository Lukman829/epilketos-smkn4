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

-- token_batches: Admin only (no direct public access)
CREATE POLICY "Deny all public on token_batches" ON token_batches FOR ALL USING (false);

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
-- in a single atomic transaction. Hour-bucketed timestamp protects voter anonymity.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.cast_vote(
    p_token_hash TEXT,
    p_candidate_ketua_id TEXT,
    p_candidate_wakil_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    -- 2. Validate token and lock row to prevent race conditions
    SELECT id, status, class_id INTO v_token_id, v_token_status, v_class_id
    FROM voting_tokens
    WHERE token_hash = p_token_hash
    FOR UPDATE;

    IF v_token_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token pemilihan tidak valid atau tidak terdaftar.');
    END IF;

    IF v_token_status = 'revoked' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token ini telah dibatalkan oleh panitia.');
    END IF;

    IF v_token_status = 'used' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token sudah pernah digunakan.');
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

    -- 7. Insert anonymous ballot (hour bucketed timestamp to preserve voter anonymity)
    INSERT INTO ballots (candidate_ketua_id, candidate_wakil_id, created_at)
    VALUES (p_candidate_ketua_id, p_candidate_wakil_id, date_trunc('hour', NOW()));

    RETURN jsonb_build_object(
        'success', true,
        'message', 'SUARAMU TELAH TERCATAT.',
        'timestamp', NOW()
    );
END;
$$;

-- ==============================================================================
-- VALIDATE TOKEN RPC FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_token(p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_election_status TEXT;
    v_token RECORD;
BEGIN
    SELECT status INTO v_election_status FROM election_settings WHERE id = 'default';
    
    SELECT t.id, t.status, t.revoked_reason, t.class_id, c.name as class_name
    INTO v_token
    FROM voting_tokens t
    LEFT JOIN classes c ON c.id = t.class_id
    WHERE t.token_hash = p_token_hash;

    IF v_token.id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Token pemilihan tidak ditemukan atau salah ketik. Periksa kembali token pada kartu Anda.'
        );
    END IF;

    IF v_token.status = 'revoked' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'revoked',
            'error', 'Token ini telah dibatalkan oleh panitia (' || COALESCE(v_token.revoked_reason, 'Penggantian token') || '). Silakan minta token pengganti kepada panitia.'
        );
    END IF;

    IF v_token.status = 'used' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'used',
            'error', 'Token ini sudah pernah digunakan untuk memilih dan tidak dapat digunakan kembali.'
        );
    END IF;

    IF v_election_status = 'not_started' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Pemilihan belum dibuka oleh panitia pelaksana.'
        );
    END IF;

    IF v_election_status = 'closed' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Pemilihan telah resmi ditutup oleh panitia.'
        );
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'status', 'active',
        'className', COALESCE(v_token.class_name, 'Siswa SMKN 4')
    );
END;
$$;

-- ==============================================================================
-- GET ELECTION RESULTS RPC FUNCTION (Role-guarded: Only service_role can see pre-published tally)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_election_results(p_is_admin boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_settings RECORD;
    v_total_eligible INT;
    v_total_issued INT;
    v_total_used INT;
    v_total_ballots INT;
    v_turnout NUMERIC;
    v_ketua_results JSONB;
    v_wakil_results JSONB;
    v_is_authorized_admin BOOLEAN;
BEGIN
    SELECT * INTO v_settings FROM election_settings WHERE id = 'default';

    SELECT COALESCE(SUM(voter_quota), 0) INTO v_total_eligible 
    FROM classes 
    WHERE major IN ('TKJ', 'TSM', 'TKRO', 'TBSM', 'MPLB', 'AK', 'TEI', 'TITL');

    SELECT COUNT(*) INTO v_total_issued FROM voting_tokens WHERE status != 'revoked';
    SELECT COUNT(*) INTO v_total_used FROM voting_tokens WHERE status = 'used';
    SELECT COUNT(*) INTO v_total_ballots FROM ballots;

    IF v_total_eligible > 0 THEN
        v_turnout := ROUND((v_total_ballots::numeric / v_total_eligible::numeric) * 100, 1);
    ELSE
        v_turnout := 0;
    END IF;

    v_is_authorized_admin := p_is_admin AND (
        auth.role() = 'service_role' OR 
        current_user = 'postgres' OR
        COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    );

    IF NOT COALESCE(v_settings.is_results_published, false) AND NOT v_is_authorized_admin THEN
        RETURN jsonb_build_object(
            'settings', row_to_json(v_settings),
            'total_eligible_voters', v_total_eligible,
            'total_tokens_issued', v_total_issued,
            'total_tokens_used', v_total_used,
            'total_ballots', 0,
            'turnout_percentage', 0,
            'ketua_results', '[]'::jsonb,
            'wakil_results', '[]'::jsonb,
            'class_participation', '[]'::jsonb,
            'is_published', false,
            'published_at', null
        );
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'candidate', jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'type', c.type,
                'candidate_number', c.candidate_number,
                'photo_url', c.photo_url,
                'grade_major', c.grade_major,
                'vision', c.vision,
                'missions', c.missions,
                'programs', c.programs
            ),
            'votes', COALESCE(b_count.cnt, 0),
            'percentage', CASE WHEN v_total_ballots > 0 THEN ROUND((COALESCE(b_count.cnt, 0)::numeric / v_total_ballots::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY c.candidate_number
    ) INTO v_ketua_results
    FROM candidates c
    LEFT JOIN (
        SELECT candidate_ketua_id, COUNT(*) as cnt FROM ballots GROUP BY candidate_ketua_id
    ) b_count ON b_count.candidate_ketua_id = c.id
    WHERE c.type = 'ketua' AND c.is_active = true;

    SELECT jsonb_agg(
        jsonb_build_object(
            'candidate', jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'type', c.type,
                'candidate_number', c.candidate_number,
                'photo_url', c.photo_url,
                'grade_major', c.grade_major,
                'vision', c.vision,
                'missions', c.missions,
                'programs', c.programs
            ),
            'votes', COALESCE(b_count.cnt, 0),
            'percentage', CASE WHEN v_total_ballots > 0 THEN ROUND((COALESCE(b_count.cnt, 0)::numeric / v_total_ballots::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY c.candidate_number
    ) INTO v_wakil_results
    FROM candidates c
    LEFT JOIN (
        SELECT candidate_wakil_id, COUNT(*) as cnt FROM ballots GROUP BY candidate_wakil_id
    ) b_count ON b_count.candidate_wakil_id = c.id
    WHERE c.type = 'wakil' AND c.is_active = true;

    RETURN jsonb_build_object(
        'settings', row_to_json(v_settings),
        'total_eligible_voters', v_total_eligible,
        'total_tokens_issued', v_total_issued,
        'total_tokens_used', v_total_used,
        'total_ballots', v_total_ballots,
        'turnout_percentage', v_turnout,
        'ketua_results', COALESCE(v_ketua_results, '[]'::jsonb),
        'wakil_results', COALESCE(v_wakil_results, '[]'::jsonb),
        'class_participation', '[]'::jsonb,
        'is_published', COALESCE(v_settings.is_results_published, false),
        'published_at', v_settings.results_published_at
    );
END;
$$;

-- ==============================================================================
-- ADMIN RPC FUNCTIONS (Service Role Only)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_clear_all_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.ballots;
    DELETE FROM public.voting_tokens;
    DELETE FROM public.token_batches;
    
    UPDATE public.classes 
    SET voted_count = 0, tokens_generated = 0, updated_at = NOW()
    WHERE id IS NOT NULL;

    UPDATE public.election_settings
    SET is_results_published = false,
        results_published_at = NULL,
        results_published_by = NULL
    WHERE id = 'default';

    RETURN jsonb_build_object('success', true, 'message', 'All ballots, tokens, and batches cleared.');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_generate_batch_tokens(
    p_batch_id text,
    p_batch_name text,
    p_class_id text,
    p_total_tokens integer,
    p_created_by text,
    p_tokens jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    elem jsonb;
BEGIN
    INSERT INTO token_batches (id, batch_name, class_id, total_tokens, created_by, created_at)
    VALUES (p_batch_id, p_batch_name, p_class_id, p_total_tokens, p_created_by, NOW())
    ON CONFLICT (id) DO NOTHING;

    FOR elem IN SELECT * FROM jsonb_array_elements(p_tokens)
    LOOP
        INSERT INTO voting_tokens (
            id, token_hash, token_preview, class_id, batch_id, status, created_at
        ) VALUES (
            elem->>'id',
            elem->>'token_hash',
            elem->>'token_preview',
            elem->>'class_id',
            elem->>'batch_id',
            'active',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    UPDATE classes
    SET tokens_generated = COALESCE(tokens_generated, 0) + p_total_tokens, updated_at = NOW()
    WHERE id = p_class_id;

    RETURN jsonb_build_object('success', true, 'count', p_total_tokens);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_logs jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'action', l.action,
            'actor', l.actor,
            'details', l.details,
            'created_at', l.created_at
        ) ORDER BY l.created_at DESC
    ) INTO v_logs
    FROM (
        SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT LEAST(p_limit, 200)
    ) l;

    RETURN COALESCE(v_logs, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_tokens(p_class_id text DEFAULT NULL::text, p_status text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tokens jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'preview', t.token_preview,
            'plain', t.token_preview,
            'class_id', t.class_id,
            'class_name', COALESCE(c.name, 'Kelas SMKN 4'),
            'status', t.status,
            'created_at', t.created_at,
            'used_at', t.used_at,
            'revoked_at', t.revoked_at,
            'revoked_reason', t.revoked_reason,
            'replacement_token_id', t.replacement_token_id
        ) ORDER BY t.created_at DESC
    ) INTO v_tokens
    FROM voting_tokens t
    LEFT JOIN classes c ON c.id = t.class_id
    WHERE (p_class_id IS NULL OR p_class_id = 'all' OR t.class_id = p_class_id)
      AND (p_status IS NULL OR p_status = 'all' OR t.status = p_status);

    RETURN COALESCE(v_tokens, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_results(p_is_published boolean, p_published_by text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE election_settings
    SET is_results_published = p_is_published,
        results_published_at = CASE WHEN p_is_published THEN NOW() ELSE NULL END,
        results_published_by = CASE WHEN p_is_published THEN p_published_by ELSE NULL END,
        updated_at = NOW()
    WHERE id = 'default';

    RETURN jsonb_build_object('success', true, 'is_results_published', p_is_published);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_record_audit_log(p_action text, p_actor text, p_details jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO audit_logs (id, action, actor, details, created_at)
    VALUES (gen_random_uuid(), p_action, p_actor, p_details, NOW());

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_token(p_token_id text, p_reason text, p_replacement jsonb, p_revoked_by text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE voting_tokens
    SET status = 'revoked',
        revoked_at = NOW(),
        revoked_reason = p_reason,
        replacement_token_id = CASE WHEN p_replacement IS NOT NULL THEN p_replacement->>'id' ELSE NULL END
    WHERE id = p_token_id;

    IF p_replacement IS NOT NULL THEN
        INSERT INTO voting_tokens (
            id, token_hash, token_preview, class_id, batch_id, status, created_at
        ) VALUES (
            p_replacement->>'id',
            p_replacement->>'token_hash',
            p_replacement->>'token_preview',
            p_replacement->>'class_id',
            p_replacement->>'batch_id',
            'active',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_status(p_status text, p_updated_by text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_status NOT IN ('not_started', 'ongoing', 'closed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Status tidak valid');
    END IF;

    UPDATE election_settings
    SET status = p_status, updated_at = NOW()
    WHERE id = 'default';

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- ==============================================================================
-- PERMISSIONS: EXECUTE GRANTS & REVOCATIONS
-- ==============================================================================

-- Revoke all admin functions from public and anonymous users
REVOKE ALL ON FUNCTION public.admin_clear_all_test_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_clear_all_test_data() TO service_role;

REVOKE ALL ON FUNCTION public.admin_generate_batch_tokens(text, text, text, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_batch_tokens(text, text, text, integer, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_audit_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_audit_logs(integer) TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_tokens(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_tokens(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_publish_results(boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_results(boolean, text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_record_audit_log(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_audit_log(text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.admin_revoke_token(text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_token(text, text, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_toggle_status(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_status(text, text) TO service_role;

-- Public / Student voting functions (Executable without login by students holding valid tokens)
REVOKE ALL ON FUNCTION public.cast_vote(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cast_vote(text, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.validate_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_token(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_election_results(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_election_results(boolean) TO anon, authenticated, service_role;
