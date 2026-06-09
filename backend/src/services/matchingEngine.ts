/**
 * Professional Tier-Based Candidate Matching Engine
 * 
 * System: Replaces points-based matching with transparent, tier-based classification
 * Tiers:
 *  - TIER_1 (90-100%): Best Fit - Interview Immediately
 *  - TIER_2 (75-89%):  Good Fit - Interview
 *  - TIER_3 (60-74%):  Acceptable - Consider Caution
 *  - TIER_4 (<60%):    Poor Fit - Pass
 */

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

/**
 * SKILL ALIASES
 * Map variations of skill names to canonical forms
 */
const SKILL_ALIASES: Record<string, string[]> = {
  'react': ['reactjs', 'react.js', 'react js'],
  'nodejs': ['node.js', 'node js', 'node'],
  'typescript': ['ts', 'typescript'],
  'javascript': ['js', 'javascript'],
  'cpp': ['c++', 'c plus plus'],
  'csharp': ['c#', 'c sharp'],
  'golang': ['go', 'golang'],
  'python': ['py', 'python'],
  'java': ['java'],
  'sql': ['sql', 'postgres', 'postgresql', 'mysql'],
  'aws': ['aws', 'amazon web services'],
  'docker': ['docker'],
  'kubernetes': ['k8s', 'kubernetes'],
  'vue': ['vue', 'vue.js'],
  'angular': ['angular', 'angularjs'],
  'svelte': ['svelte'],
  'nextjs': ['next.js', 'next js', 'nextjs'],
  'nestjs': ['nest.js', 'nest js', 'nestjs'],
  'express': ['expressjs', 'express.js'],
  'fastapi': ['fastapi'],
  'django': ['django'],
  'flask': ['flask'],
  'rust': ['rust'],
  'php': ['php'],
  'ruby': ['ruby'],
  'rails': ['rails', 'ruby on rails'],
  'mongodb': ['mongodb', 'mongo'],
  'firebase': ['firebase'],
  'graphql': ['graphql'],
  'rest': ['rest', 'restapi'],
  'testing': ['jest', 'mocha', 'pytest', 'testing'],
  'ci/cd': ['cicd', 'ci/cd', 'jenkins'],
};

/**
 * LOCATION GROUPS
 * Normalize locations to canonical forms
 */
const LOCATION_GROUPS: Record<string, string[]> = {
  'new york': ['ny', 'nyc', 'new york', 'new york city'],
  'san francisco': ['sf', 'san fran', 'san francisco', 'bay area'],
  'los angeles': ['la', 'los angeles', 'lax'],
  'chicago': ['chicago', 'chi'],
  'boston': ['boston', 'bos'],
  'seattle': ['seattle', 'sea'],
  'denver': ['denver', 'denver co'],
  'austin': ['austin', 'atx'],
  'remote': ['remote', 'work from home', 'wfh', 'anywhere'],
};

/**
 * Normalize a skill string to lowercase, trimmed, no spaces
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/\s+/g, '');
}

/**
 * Check if two skills match (exact or fuzzy)
 */
function skillsMatch(skill1: string, skill2: string): boolean {
  const norm1 = normalizeSkill(skill1);
  const norm2 = normalizeSkill(skill2);

  // Exact match
  if (norm1 === norm2) return true;

  // Check aliases
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const allForms = [canonical, ...aliases].map(normalizeSkill);
    if (allForms.includes(norm1) && allForms.includes(norm2)) {
      return true;
    }
  }

  // Partial substring match (e.g., "react" matches "react.js")
  if (
    (norm1.includes(norm2) || norm2.includes(norm1)) &&
    Math.min(norm1.length, norm2.length) > 2
  ) {
    return true;
  }

  return false;
}

/**
 * Parse experience string to extract years
 * Examples: "5+ years" → 5, "3-5 years" → 3, "Entry Level" → 0
 */
function parseExperienceYears(exp: string | null | undefined): number {
  if (!exp) return -1; // Unknown

  const match = exp.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  // Check for entry level indicators
  if (exp.toLowerCase().includes('entry') || exp.toLowerCase().includes('junior')) {
    return 0;
  }

  return -1; // Unknown
}

/**
 * Detect seniority level from title and experience
 */
function detectSeniority(text: string, yearsOfExp: number): SeniorityLevel {
  const lower = text.toLowerCase();

  // Check for lead/principal/architect
  if (
    lower.includes('lead') ||
    lower.includes('principal') ||
    lower.includes('architect') ||
    yearsOfExp >= 10
  ) {
    return 'LEAD';
  }

  // Check for senior
  if (
    lower.includes('senior') ||
    lower.includes('sr') ||
    yearsOfExp >= 7
  ) {
    return 'SENIOR';
  }

  // Check for mid-level
  if (lower.includes('mid') || yearsOfExp >= 3) {
    return 'MID_LEVEL';
  }

  return 'JUNIOR';
}

/**
 * Normalize location string
 */
function normalizeLocation(location: string): string {
  if (!location) return '';
  const lower = location.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(LOCATION_GROUPS)) {
    if (aliases.some(alias => lower.includes(alias))) {
      return canonical;
    }
  }

  return lower;
}

/**
 * Calculate skill coverage percentage
 * Returns: 0-100% of required skills that candidate has
 */
function calculateSkillCoverage(
  jobSkills: string,
  candidateSkills: string
): number {
  const jobArray = jobSkills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (jobArray.length === 0) return 0;

  const candArray = candidateSkills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (candArray.length === 0) return 0;

  let matches = 0;
  jobArray.forEach(jobSkill => {
    if (candArray.some(candSkill => skillsMatch(jobSkill, candSkill))) {
      matches++;
    }
  });

  return Math.round((matches / jobArray.length) * 100);
}

/**
 * Evaluate experience adequacy
 */
function evaluateExperienceAdequacy(
  candidateExpString: string,
  jobExpString: string
): ExperienceAdequacy {
  const candYears = parseExperienceYears(candidateExpString);
  const jobYears = parseExperienceYears(jobExpString);

  if (candYears === -1) return 'UNKNOWN';
  if (jobYears === -1) return 'UNKNOWN'; // Job requirement unknown, assume ok

  if (candYears >= jobYears) return 'EXCEEDS';
  if (candYears >= jobYears - 2) return 'ACCEPTABLE';
  return 'INSUFFICIENT';
}

/**
 * Evaluate location match
 */
function evaluateLocationMatch(
  candidateLocation: string,
  jobLocation: string
): LocationMatch {
  const candLoc = normalizeLocation(candidateLocation);
  const jobLoc = normalizeLocation(jobLocation);

  if (candLoc === jobLoc) return 'EXACT';
  if (candLoc.includes('remote') || jobLoc.includes('remote')) {
    return 'REMOTE_COMPATIBLE';
  }
  if (
    candLoc.includes(jobLoc) ||
    jobLoc.includes(candLoc) ||
    (candLoc && jobLoc && candLoc.split(',')[0] === jobLoc.split(',')[0])
  ) {
    return 'SAME_REGION';
  }

  return 'DIFFERENT';
}

/**
 * Build strengths summary
 */
function buildStrengths(
  skillCoverage: number,
  expAdequacy: ExperienceAdequacy,
  locationMatch: LocationMatch,
  candidateSeniority: SeniorityLevel,
  jobSeniority: SeniorityLevel
): string {
  const parts: string[] = [];

  if (skillCoverage >= 80) {
    parts.push(`${skillCoverage}% skill match`);
  } else if (skillCoverage >= 60) {
    parts.push(`${skillCoverage}% skill match (trainable)`);
  }

  if (expAdequacy === 'EXCEEDS') {
    parts.push('Exceeds experience requirement');
  } else if (expAdequacy === 'ACCEPTABLE') {
    parts.push('Experience within acceptable range');
  }

  if (locationMatch === 'EXACT') {
    parts.push('Perfect location match');
  } else if (locationMatch === 'REMOTE_COMPATIBLE') {
    parts.push('Remote compatible');
  }

  if (candidateSeniority === jobSeniority) {
    parts.push('Seniority level aligned');
  }

  return parts.join('. ') || 'Basic qualification met';
}

/**
 * Build gaps summary
 */
function buildGaps(
  skillCoverage: number,
  expAdequacy: ExperienceAdequacy,
  candExpYears: number,
  jobExpYears: number,
  locationMatch: LocationMatch,
  candidateLoc: string,
  jobLoc: string,
  candidateSeniority: SeniorityLevel,
  jobSeniority: SeniorityLevel
): string {
  const parts: string[] = [];

  if (skillCoverage < 80) {
    parts.push(`Missing ${100 - skillCoverage}% of required skills`);
  }

  if (expAdequacy === 'ACCEPTABLE') {
    parts.push(`${jobExpYears - candExpYears} years below requirement`);
  } else if (expAdequacy === 'INSUFFICIENT') {
    parts.push(`${jobExpYears - candExpYears}+ years experience gap`);
  }

  if (locationMatch === 'DIFFERENT') {
    parts.push(`Location mismatch: ${candidateLoc} vs ${jobLoc}`);
  } else if (locationMatch === 'SAME_REGION') {
    parts.push('Potential relocation needed');
  }

  if (candidateSeniority !== jobSeniority) {
    parts.push(`Seniority: ${candidateSeniority} vs ${jobSeniority} required`);
  }

  return parts.join('. ') || 'No significant gaps';
}

/**
 * Calculate risk summary
 */
function calculateRiskSummary(
  skillCoverage: number,
  expAdequacy: ExperienceAdequacy,
  mustHavesPassed: boolean,
  candExpYears: number,
  jobExpYears: number
): string {
  if (!mustHavesPassed) {
    if (skillCoverage < 60) {
      return `FAIL: Missing ${100 - skillCoverage}% of required skills`;
    }
    if (expAdequacy === 'INSUFFICIENT') {
      return `FAIL: Experience gap of ${jobExpYears - candExpYears}+ years`;
    }
    return 'FAIL: Does not meet must-have requirements';
  }

  if (expAdequacy === 'ACCEPTABLE') {
    return `WARNING: ${jobExpYears - candExpYears} years below requirement (acceptable within grace window)`;
  }

  return 'PASS: All must-haves met';
}

/**
 * Main matching function
 * Scores candidates against a job based on professional tier system
 */
export function matchCandidates(
  job: Job,
  candidates: RawCandidate[]
): ScoredCandidate[] {
  const jobSkillCoverage = calculateSkillCoverage(job.skills, job.skills); // For reference
  const jobExpYears = parseExperienceYears(job.experience);
  const jobSeniority = detectSeniority(job.job_title, jobExpYears);

  const scoredCandidates: ScoredCandidate[] = candidates
    .map(candidate => {
      // === STEP 1: CALCULATE INDIVIDUAL FACTORS ===
      const skillCoverage = calculateSkillCoverage(job.skills, candidate.skills);
      const expAdequacy = evaluateExperienceAdequacy(
        candidate.experience,
        job.experience
      );
      const locationMatch = evaluateLocationMatch(
        candidate.location,
        job.location
      );

      const candExpYears = parseExperienceYears(candidate.experience);
      const candidateSeniority = detectSeniority(candidate.experience, candExpYears);

      // === STEP 2: MUST-HAVES GATE ===
      const mustHavesPass =
        skillCoverage >= 60 &&
        expAdequacy !== 'INSUFFICIENT' &&
        (job.visa === null ||
          job.visa === undefined ||
          job.visa.toLowerCase().includes('any'));

      // === STEP 3: CALCULATE MATCH PERCENTAGE ===
      let matchPercentage = 0;

      if (!mustHavesPass) {
        matchPercentage = 0;
      } else {
        // Start with ACTUAL skill coverage as base (not 100%)
        // This ensures skill gaps are reflected in final score
        matchPercentage = skillCoverage;

        // Location match bonus: +15 (exact), +12 (remote), +8 (same region), 0 (different)
        if (locationMatch === 'EXACT') {
          matchPercentage += 15;
        } else if (locationMatch === 'REMOTE_COMPATIBLE') {
          matchPercentage += 12;
        } else if (locationMatch === 'SAME_REGION') {
          matchPercentage += 8;
        }
        // Different location: no bonus, no penalty

        // Seniority alignment bonus: +10 (exact match)
        if (candidateSeniority === jobSeniority) {
          matchPercentage += 10;
        } else if (
          candidateSeniority === 'LEAD' &&
          jobSeniority === 'SENIOR'
        ) {
          matchPercentage += 8; // Overqualified but acceptable
        }
        // Seniority mismatch: no bonus, no penalty

        // Experience gap penalty: -5 (within acceptable window, but trainable)
        if (expAdequacy === 'ACCEPTABLE') {
          matchPercentage -= 5;
        }

        // Cap at 100
        matchPercentage = Math.min(matchPercentage, 100);
      }

      // === STEP 4: ASSIGN TIER ===
      let tier: MatchTier;
      if (matchPercentage >= 90) {
        tier = 'TIER_1';
      } else if (matchPercentage >= 75) {
        tier = 'TIER_2';
      } else if (matchPercentage >= 60) {
        tier = 'TIER_3';
      } else {
        tier = 'TIER_4';
      }

      // === STEP 5: DECISION ===
      let decision: Decision;
      if (tier === 'TIER_1') {
        decision = 'INTERVIEW_IMMEDIATELY';
      } else if (tier === 'TIER_2') {
        decision = 'INTERVIEW';
      } else if (tier === 'TIER_3') {
        decision = 'CONSIDER_CAUTION';
      } else {
        decision = 'PASS';
      }

      // === STEP 6: BUILD NARRATIVES ===
      const strengths = buildStrengths(
        skillCoverage,
        expAdequacy,
        locationMatch,
        candidateSeniority,
        jobSeniority
      );

      const gaps = buildGaps(
        skillCoverage,
        expAdequacy,
        candExpYears,
        jobExpYears,
        locationMatch,
        candidate.location,
        job.location,
        candidateSeniority,
        jobSeniority
      );

      const riskSummary = calculateRiskSummary(
        skillCoverage,
        expAdequacy,
        mustHavesPass,
        candExpYears,
        jobExpYears
      );

      const seniorityMatch = `${candidateSeniority} (${jobSeniority} required)`;

      // === RETURN SCORED CANDIDATE ===
      return {
        ...candidate,
        match_percentage: matchPercentage,
        tier,
        decision,
        must_haves_passed: mustHavesPass,
        skill_coverage: skillCoverage,
        experience_adequacy: expAdequacy,
        location_match: locationMatch,
        visa_status: job.visa || 'NO_REQUIREMENT',
        risk_summary: riskSummary,
        strengths,
        gaps,
        seniority_match: seniorityMatch,
        candidate_seniority: candidateSeniority,
        job_seniority: jobSeniority,
      };
    })
    // === STEP 7: SORT & FILTER ===
    .filter(c => c.skill_coverage >= 30) // Show even partial matches for review
    .sort((a, b) => {
      // Sort by: tier (best first), then match percentage, then skill coverage
      const tierOrder = { TIER_1: 0, TIER_2: 1, TIER_3: 2, TIER_4: 3 };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;

      const percentDiff = b.match_percentage - a.match_percentage;
      if (percentDiff !== 0) return percentDiff;

      return b.skill_coverage - a.skill_coverage;
    })
    .slice(0, 50); // Return top 50

  return scoredCandidates;
}

/**
 * Get display color for tier
 */
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

/**
 * Get display icon for decision
 */
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
