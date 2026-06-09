export type MatchTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
export type Decision = 'INTERVIEW_IMMEDIATELY' | 'INTERVIEW' | 'CONSIDER_CAUTION' | 'PASS';
export type ExperienceAdequacy = 'EXCEEDS' | 'ACCEPTABLE' | 'INSUFFICIENT' | 'UNKNOWN';
export type LocationMatch = 'EXACT' | 'REMOTE_COMPATIBLE' | 'SAME_REGION' | 'DIFFERENT';
export type SeniorityLevel = 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'LEAD';

export interface Job {
  id: string;
  job_title: string;
  location: string;
  experience: string;
  skills: string;
  role_overview: string;
  visa?: string;
}

export interface RawCandidate {
  id: string;
  name: string;
  email: string;
  skills: string;
  experience: string;
  location: string;
  resume?: string | null;
  _info?: string;
}

export interface ScoredCandidate extends RawCandidate {
  match_percentage: number;
  tier: MatchTier;
  decision: Decision;
  must_haves_passed: boolean;
  skill_coverage: number;
  experience_adequacy: ExperienceAdequacy;
  location_match: LocationMatch;
  visa_status: string;
  risk_summary: string;
  strengths: string;
  gaps: string;
  seniority_match: string;
  candidate_seniority: SeniorityLevel;
  job_seniority: SeniorityLevel;
}

export function getTierColor(tier: MatchTier): string {
  switch (tier) {
    case 'TIER_1':
      return 'emerald'; // Green
    case 'TIER_2':
      return 'blue'; // Blue
    case 'TIER_3':
      return 'amber'; // Yellow
    case 'TIER_4':
      return 'red'; // Red
  }
}

export function getDecisionIcon(decision: Decision): string {
  switch (decision) {
    case 'INTERVIEW_IMMEDIATELY':
      return '🟢';
    case 'INTERVIEW':
      return '🔵';
    case 'CONSIDER_CAUTION':
      return '🟡';
    case 'PASS':
      return '🔴';
  }
}
