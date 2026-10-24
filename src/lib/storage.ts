import crypto from 'crypto';
import {
  Candidate,
  ClassRecord,
  VotingToken,
  TokenBatch,
  Ballot,
  ElectionSettings,
  AuditLog,
  ElectionResultsData,
  CandidateTally,
} from '@/types/election';
import {
  DEFAULT_ELECTION_SETTINGS,
  INITIAL_CANDIDATES,
  INITIAL_CLASSES,
} from './constants';

// Helper for SHA-256 hash
export function hashToken(token: string): string {
  const clean = token.trim().toUpperCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

// Generate cryptographically secure random token (Format: PLK-XXXX-YYYY)
export function generateSecureToken(): string {
  // Safe characters (avoid 0, O, 1, I to eliminate reading ambiguity on printed sheets)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const getRand = (len: number) => {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `PLK-${getRand(4)}-${getRand(4)}`;
}

// Global In-Memory state for Next.js server instance
interface ElectionStore {
  settings: ElectionSettings;
  candidates: Candidate[];
  classes: ClassRecord[];
  tokens: VotingToken[];
  batches: TokenBatch[];
  ballots: Ballot[];
  auditLogs: AuditLog[];
  initialized: boolean;
}

// Persist across hot reloads in development
const globalForStore = global as unknown as { __electionStore?: ElectionStore };

export const store: ElectionStore = globalForStore.__electionStore || {
  settings: { ...DEFAULT_ELECTION_SETTINGS },
  candidates: JSON.parse(JSON.stringify(INITIAL_CANDIDATES)),
  classes: JSON.parse(JSON.stringify(INITIAL_CLASSES)),
  tokens: [],
  batches: [],
  ballots: [],
  auditLogs: [],
  initialized: false,
};

if (process.env.NODE_ENV !== 'production') {
  globalForStore.__electionStore = store;
}

// Seed initial token allocation if store is uninitialized
export function initStoreIfNeeded() {
  if (store.initialized) return;

  // Create initial allocation batches for classes
  const initialBatches: TokenBatch[] = [];
  const initialTokens: VotingToken[] = [];

  // Generate initial tokens for classes
  store.classes.slice(0, 4).forEach((cls) => {
    const batchId = `batch-${cls.id}`;
    initialBatches.push({
      id: batchId,
      batch_name: `Batch Alokasi Awal - ${cls.name}`,
      class_id: cls.id,
      class_name: cls.name,
      total_tokens: 5,
      created_by: 'Sistem Panitia',
      created_at: new Date().toISOString(),
    });

    for (let i = 0; i < 5; i++) {
      const plainToken = generateSecureToken();
      const hash = hashToken(plainToken);
      const preview = `${plainToken.slice(0, 7)}***${plainToken.slice(-2)}`;

      initialTokens.push({
        id: `tok-${cls.id}-${i + 1}`,
        token_hash: hash,
        token_preview: preview,
        plain_token: plainToken,
        class_id: cls.id,
        class_name: cls.name,
        batch_id: batchId,
        status: 'active',
        created_at: new Date().toISOString(),
        used_at: null,
        revoked_at: null,
        revoked_reason: null,
        replacement_token_id: null,
      });
    }
  });

  store.batches = initialBatches;
  store.tokens = initialTokens;

  // Add initial system audit log
  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'SYSTEM_INITIALIZATION',
    actor: 'Panitia Pelaksana SMKN 4 Kota Serang',
    details: {
      message: 'Platform E-PILKETOS diinisialisasi dengan konfigurasi baku.',
      candidates_count: store.candidates.length,
      classes_count: store.classes.length,
    },
    created_at: new Date().toISOString(),
  });

  store.initialized = true;
}

// Ensure store is ready
initStoreIfNeeded();

// --- PUBLIC ACCESS METHODS ---

export function getPublicElectionSettings(): ElectionSettings {
  return { ...store.settings };
}

export function getActiveCandidates(): { ketua: Candidate[]; wakil: Candidate[] } {
  const active = store.candidates.filter((c) => c.is_active);
  return {
    ketua: active
      .filter((c) => c.type === 'ketua')
      .sort((a, b) => a.display_order - b.display_order),
    wakil: active
      .filter((c) => c.type === 'wakil')
      .sort((a, b) => a.display_order - b.display_order),
  };
}

export function getCandidateById(id: string): Candidate | undefined {
  return store.candidates.find((c) => c.id === id);
}

// Token validation before voting
export function validateTokenStatus(tokenString: string): {
  valid: boolean;
  status?: string;
  error?: string;
  className?: string;
} {
  const hash = hashToken(tokenString);
  const tokenRecord = store.tokens.find((t) => t.token_hash === hash);

  if (!tokenRecord) {
    return {
      valid: false,
      error: 'Token pemilihan tidak ditemukan atau salah ketik. Periksa kembali token pada kartu Anda.',
    };
  }

  if (tokenRecord.status === 'revoked') {
    return {
      valid: false,
      status: 'revoked',
      error: `Token ini telah dibatalkan oleh panitia (${tokenRecord.revoked_reason || 'Penggantian token'}). Silakan minta token pengganti kepada panitia.`,
    };
  }

  if (tokenRecord.status === 'used') {
    return {
      valid: false,
      status: 'used',
      error: 'Token ini sudah pernah digunakan untuk memilih dan tidak dapat digunakan kembali.',
    };
  }

  if (store.settings.status === 'not_started') {
    return {
      valid: false,
      error: 'Pemilihan belum dibuka oleh panitia. Silakan tunggu jadwal resmi.',
    };
  }

  if (store.settings.status === 'closed') {
    return {
      valid: false,
      error: 'Sesi pemilihan telah ditutup secara resmi oleh panitia.',
    };
  }

  return {
    valid: true,
    className: tokenRecord.class_name,
  };
}

// Cast Vote Atomic RPC
export function castVote(
  tokenString: string,
  candidateKetuaId: string,
  candidateWakilId: string
): { success: boolean; error?: string; timestamp?: string } {
  // 1. Check election state
  if (store.settings.status !== 'ongoing') {
    return {
      success: false,
      error: 'Pemilihan saat ini tidak sedang berlangsung.',
    };
  }

  // 2. Validate token
  const hash = hashToken(tokenString);
  const tokenIndex = store.tokens.findIndex((t) => t.token_hash === hash);

  if (tokenIndex === -1) {
    return {
      success: false,
      error: 'Token pemilihan tidak valid.',
    };
  }

  const tokenRecord = store.tokens[tokenIndex];

  if (tokenRecord.status !== 'active') {
    if (tokenRecord.status === 'used') {
      return {
        success: false,
        error: 'Token sudah pernah digunakan.',
      };
    }
    return {
      success: false,
      error: 'Token telah dibatalkan oleh panitia.',
    };
  }

  // 3. Validate candidates
  const ketua = store.candidates.find(
    (c) => c.id === candidateKetuaId && c.is_active && c.type === 'ketua'
  );
  if (!ketua) {
    return {
      success: false,
      error: 'Pilihan Calon Ketua OSIS tidak valid atau tidak terdaftar aktif.',
    };
  }

  const wakil = store.candidates.find(
    (c) => c.id === candidateWakilId && c.is_active && c.type === 'wakil'
  );
  if (!wakil) {
    return {
      success: false,
      error: 'Pilihan Calon Wakil Ketua OSIS tidak valid atau tidak terdaftar aktif.',
    };
  }

  // 4. Atomic transaction:
  const now = new Date().toISOString();

  // Mark token used
  store.tokens[tokenIndex] = {
    ...tokenRecord,
    status: 'used',
    used_at: now,
  };

  // Increment class participation count anonymously
  const classIndex = store.classes.findIndex((c) => c.id === tokenRecord.class_id);
  if (classIndex !== -1) {
    store.classes[classIndex].voted_count += 1;
  }

  // Insert Anonymous Ballot (NO reference to token_id, class_id, or student!)
  const ballotId = `blt-${crypto.randomUUID()}`;
  store.ballots.push({
    id: ballotId,
    candidate_ketua_id: candidateKetuaId,
    candidate_wakil_id: candidateWakilId,
    created_at: now,
  });

  return {
    success: true,
    timestamp: now,
  };
}

// Public or Admin Results
export function getElectionResults(isAdmin = false): ElectionResultsData {
  const isPublished = store.settings.is_results_published;

  const totalEligible = store.classes.reduce((sum, c) => sum + c.voter_quota, 0);
  const totalTokensIssued = store.tokens.filter((t) => t.status !== 'revoked').length;
  const totalTokensUsed = store.tokens.filter((t) => t.status === 'used').length;
  const totalBallots = store.ballots.length;
  const turnoutPercentage = totalEligible > 0 
    ? Math.round((totalBallots / totalEligible) * 100 * 10) / 10 
    : 0;

  // Class participation aggregates
  const classParticipation = store.classes.map((cls) => {
    const quota = cls.voter_quota;
    const voted = cls.voted_count;
    const percentage = quota > 0 ? Math.round((voted / quota) * 100 * 10) / 10 : 0;
    return {
      class_id: cls.id,
      class_name: cls.name,
      quota,
      voted,
      percentage,
    };
  });

  // Calculate tallies
  const ketuaCandidates = store.candidates.filter((c) => c.type === 'ketua');
  const wakilCandidates = store.candidates.filter((c) => c.type === 'wakil');

  const ketuaVotesMap: Record<string, number> = {};
  const wakilVotesMap: Record<string, number> = {};

  store.ballots.forEach((b) => {
    ketuaVotesMap[b.candidate_ketua_id] = (ketuaVotesMap[b.candidate_ketua_id] || 0) + 1;
    wakilVotesMap[b.candidate_wakil_id] = (wakilVotesMap[b.candidate_wakil_id] || 0) + 1;
  });

  const ketuaResults: CandidateTally[] = ketuaCandidates.map((c) => {
    const votes = ketuaVotesMap[c.id] || 0;
    const percentage = totalBallots > 0 ? Math.round((votes / totalBallots) * 100 * 10) / 10 : 0;
    return { candidate: c, votes, percentage };
  }).sort((a, b) => a.candidate.candidate_number - b.candidate.candidate_number);

  const wakilResults: CandidateTally[] = wakilCandidates.map((c) => {
    const votes = wakilVotesMap[c.id] || 0;
    const percentage = totalBallots > 0 ? Math.round((votes / totalBallots) * 100 * 10) / 10 : 0;
    return { candidate: c, votes, percentage };
  }).sort((a, b) => a.candidate.candidate_number - b.candidate.candidate_number);

  // If results are NOT published and viewer is NOT authorized admin, hide tallies
  if (!isPublished && !isAdmin) {
    return {
      settings: store.settings,
      total_eligible_voters: totalEligible,
      total_tokens_issued: totalTokensIssued,
      total_tokens_used: totalTokensUsed,
      total_ballots: 0,
      turnout_percentage: 0,
      ketua_results: [],
      wakil_results: [],
      class_participation: [],
      is_published: false,
      published_at: null,
    };
  }

  return {
    settings: store.settings,
    total_eligible_voters: totalEligible,
    total_tokens_issued: totalTokensIssued,
    total_tokens_used: totalTokensUsed,
    total_ballots: totalBallots,
    turnout_percentage: turnoutPercentage,
    ketua_results: ketuaResults,
    wakil_results: wakilResults,
    class_participation: isAdmin ? classParticipation : [],
    is_published: isPublished,
    published_at: store.settings.results_published_at,
  };
}

// --- ADMIN MANAGEMENT METHODS ---

export function adminUpdateSettings(
  updates: Partial<ElectionSettings>,
  actor: string
): ElectionSettings {
  store.settings = { ...store.settings, ...updates };

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'UPDATE_ELECTION_SETTINGS',
    actor,
    details: { updates },
    created_at: new Date().toISOString(),
  });

  return store.settings;
}

export function adminToggleElectionStatus(
  newStatus: 'not_started' | 'ongoing' | 'closed',
  actor: string
): ElectionSettings {
  store.settings.status = newStatus;

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'CHANGE_ELECTION_STATUS',
    actor,
    details: { new_status: newStatus },
    created_at: new Date().toISOString(),
  });

  return store.settings;
}

export function adminPublishResults(published: boolean, actor: string): ElectionSettings {
  store.settings.is_results_published = published;
  store.settings.results_published_at = published ? new Date().toISOString() : null;
  store.settings.results_published_by = published ? actor : null;

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: published ? 'PUBLISH_RESULTS' : 'UNPUBLISH_RESULTS',
    actor,
    details: { is_published: published },
    created_at: new Date().toISOString(),
  });

  return store.settings;
}

export function adminGenerateBatchTokens(
  classId: string,
  count: number,
  actor: string
): { batch: TokenBatch; generatedTokens: { token: string; preview: string }[] } {
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) throw new Error('Kelas tidak ditemukan');

  const batchId = `batch-${Date.now()}`;
  const batchName = `Batch Distribusi - ${cls.name}`;

  const newBatch: TokenBatch = {
    id: batchId,
    batch_name: batchName,
    class_id: cls.id,
    class_name: cls.name,
    total_tokens: count,
    created_by: actor,
    created_at: new Date().toISOString(),
  };

  const generatedTokens: { token: string; preview: string }[] = [];

  for (let i = 0; i < count; i++) {
    const plain = generateSecureToken();
    const hash = hashToken(plain);
    const preview = `${plain.slice(0, 7)}***${plain.slice(-2)}`;

    const tokenRecord: VotingToken = {
      id: `tok-${Date.now()}-${i}`,
      token_hash: hash,
      token_preview: preview,
      plain_token: plain,
      class_id: cls.id,
      class_name: cls.name,
      batch_id: batchId,
      status: 'active',
      created_at: new Date().toISOString(),
      used_at: null,
      revoked_at: null,
      revoked_reason: null,
      replacement_token_id: null,
    };

    store.tokens.push(tokenRecord);
    generatedTokens.push({ token: plain, preview });
  }

  cls.tokens_generated += count;
  store.batches.unshift(newBatch);

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'GENERATE_TOKEN_BATCH',
    actor,
    details: { class_name: cls.name, count, batch_id: batchId },
    created_at: new Date().toISOString(),
  });

  return { batch: newBatch, generatedTokens };
}

export function adminRevokeToken(
  tokenId: string,
  reason: string,
  generateReplacement: boolean,
  actor: string
): { success: boolean; replacementToken?: string; error?: string } {
  const token = store.tokens.find((t) => t.id === tokenId);
  if (!token) return { success: false, error: 'Token tidak ditemukan' };

  if (token.status === 'used') {
    return {
      success: false,
      error: 'Token yang sudah digunakan tidak dapat dibatalkan demi integritas suara yang telah masuk.',
    };
  }

  const now = new Date().toISOString();
  token.status = 'revoked';
  token.revoked_at = now;
  token.revoked_reason = reason;

  let replacementTokenPlain: string | undefined = undefined;

  if (generateReplacement) {
    const plain = generateSecureToken();
    const hash = hashToken(plain);
    const preview = `${plain.slice(0, 7)}***${plain.slice(-2)}`;
    const replacementId = `tok-rep-${Date.now()}`;

    const newToken: VotingToken = {
      id: replacementId,
      token_hash: hash,
      token_preview: preview,
      plain_token: plain,
      class_id: token.class_id,
      class_name: token.class_name,
      batch_id: token.batch_id,
      status: 'active',
      created_at: now,
      used_at: null,
      revoked_at: null,
      revoked_reason: null,
      replacement_token_id: null,
    };

    token.replacement_token_id = replacementId;
    store.tokens.push(newToken);
    replacementTokenPlain = plain;
  }

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'REVOKE_TOKEN',
    actor,
    details: {
      token_id: tokenId,
      reason,
      with_replacement: generateReplacement,
      class_name: token.class_name,
    },
    created_at: now,
  });

  return { success: true, replacementToken: replacementTokenPlain };
}

// Candidates Admin CRUD
export function adminSaveCandidate(candidate: Candidate, actor: string): Candidate {
  const index = store.candidates.findIndex((c) => c.id === candidate.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    store.candidates[index] = { ...candidate };
    store.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'UPDATE_CANDIDATE',
      actor,
      details: { candidate_name: candidate.name, type: candidate.type },
      created_at: now,
    });
  } else {
    store.candidates.push({ ...candidate });
    store.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'CREATE_CANDIDATE',
      actor,
      details: { candidate_name: candidate.name, type: candidate.type },
      created_at: now,
    });
  }
  return candidate;
}

export function adminDeleteCandidate(id: string, actor: string): boolean {
  const index = store.candidates.findIndex((c) => c.id === id);
  if (index === -1) return false;

  const candidate = store.candidates[index];
  store.candidates.splice(index, 1);

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'DELETE_CANDIDATE',
    actor,
    details: { candidate_name: candidate.name },
    created_at: new Date().toISOString(),
  });

  return true;
}

// Classes Admin CRUD
export function adminSaveClass(classItem: ClassRecord, actor: string): ClassRecord {
  const index = store.classes.findIndex((c) => c.id === classItem.id);
  if (index >= 0) {
    store.classes[index] = { ...classItem };
  } else {
    store.classes.push({ ...classItem });
  }

  store.auditLogs.unshift({
    id: `log-${Date.now()}`,
    action: 'UPDATE_CLASS',
    actor,
    details: { class_name: classItem.name, quota: classItem.voter_quota },
    created_at: new Date().toISOString(),
  });

  return classItem;
}

export function recordAuditLog(
  action: string,
  actor: string,
  details: Record<string, unknown>
): AuditLog {
  initStoreIfNeeded();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    actor,
    details,
    created_at: new Date().toISOString(),
  };
  store.auditLogs.unshift(log);
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }
  return log;
}

export function getAuditLogs(): AuditLog[] {
  return [...store.auditLogs];
}

export function getAllTokens(): VotingToken[] {
  return [...store.tokens];
}

export function getAllClasses(): ClassRecord[] {
  return [...store.classes];
}

export function getAllCandidates(): Candidate[] {
  return [...store.candidates];
}
