export type CandidateType = 'ketua' | 'wakil';

export type ElectionStatus = 'not_started' | 'ongoing' | 'closed';

export type TokenStatus = 'active' | 'used' | 'revoked';

export type AdminRole = 'ketua_panitia' | 'admin_utama';

export interface Candidate {
  id: string;
  type: CandidateType;
  candidate_number: number;
  name: string;
  grade_major: string;
  tagline: string;
  photo_url: string;
  vision: string;
  missions: string[];
  programs: string[];
  is_active: boolean;
  display_order: number;
}

export interface ClassRecord {
  id: string;
  grade: '10' | '11';
  major: string;
  name: string;
  voter_quota: number;
  tokens_generated: number;
  voted_count: number;
}

export interface VotingToken {
  id: string;
  token_hash: string;
  token_preview: string;
  plain_token?: string; // Only present right after creation or export
  class_id: string;
  class_name: string;
  batch_id: string;
  status: TokenStatus;
  created_at: string;
  used_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  replacement_token_id: string | null;
}

export interface TokenBatch {
  id: string;
  batch_name: string;
  class_id: string;
  class_name: string;
  total_tokens: number;
  created_by: string;
  created_at: string;
}

export interface Ballot {
  id: string;
  candidate_ketua_id: string;
  candidate_wakil_id: string;
  created_at: string;
}

export interface ElectionSettings {
  id: string;
  title: string;
  school_name: string;
  period_name: string;
  status: ElectionStatus;
  is_results_published: boolean;
  results_published_at: string | null;
  results_published_by: string | null;
  start_time: string | null;
  end_time: string | null;
  description: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  ip_address?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
}

export interface VotePayload {
  token: string;
  candidate_ketua_id: string;
  candidate_wakil_id: string;
}

export interface CandidateTally {
  candidate: Candidate;
  votes: number;
  percentage: number;
}

export interface ElectionResultsData {
  settings: ElectionSettings;
  total_eligible_voters: number;
  total_tokens_issued: number;
  total_tokens_used: number;
  total_ballots: number;
  turnout_percentage: number;
  ketua_results: CandidateTally[];
  wakil_results: CandidateTally[];
  class_participation: {
    class_id: string;
    class_name: string;
    quota: number;
    voted: number;
    percentage: number;
  }[];
  is_published: boolean;
  published_at: string | null;
}
