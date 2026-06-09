import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Simple Mutex Queue to prevent concurrent Groq requests from exhausting rate limits
let groqQueue: Promise<any> = Promise.resolve();
const enqueueGroq = (task: () => Promise<any>) => {
  groqQueue = groqQueue.then(task).catch(() => {}).then(() => Promise.resolve());
  return groqQueue;
};

// Global API Key Rotator for Load Balancing
let currentKeyIndex = 0;
const getNextGroqKey = () => {
  const keysStr = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  const keys = keysStr.split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  if (keys.length === 0) {
    throw new Error("No GROQ_API_KEY or GROQ_API_KEYS configured in the environment.");
  }
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return { key, index: currentKeyIndex, total: keys.length };
};

router.post('/score', async (req, res) => {
  try {
    const { job, candidates } = req.body;
    
    if (!job || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ error: "Invalid payload. Expected { job, candidates: [] }" });
    }

    // Prepare a simplified payload of candidates to save tokens
    const candidatePayload = candidates.map(c => ({
      id: c.id,
      name: c.name,
      skills: c.skills,
      experience: c.experience,
      location: c.location
    }));

    const systemPrompt = `
You are an expert AI Technical Recruiter. 
Your task is to intelligently evaluate a list of candidates against a given Job Description.
Many candidates might only provide a generic role (e.g., "Fullstack Developer") instead of a granular list of skills. You MUST infer the implicit skills associated with their role and intelligently score them against the job requirements.
For example, if the job requires "React and Node" and the candidate is a "Fullstack Developer", you MUST acknowledge they likely possess those skills and score them highly (e.g. 70-100%). Do NOT give them 0%. Use logic and standard industry knowledge to match generic roles to specific skills.

You must return a strictly formatted JSON object matching this schema exactly:
{
  "scored_candidates": [
    {
      "id": "candidate_id_here",
      "match_percentage": <number between 0 and 100>,
      "tier": "<one of: TIER_1, TIER_2, TIER_3, TIER_4>",
      "decision": "<one of: INTERVIEW_IMMEDIATELY, INTERVIEW, CONSIDER_CAUTION, PASS>",
      "must_haves_passed": <boolean>,
      "skill_coverage": <number between 0 and 100>,
      "experience_adequacy": "<one of: EXCEEDS, ACCEPTABLE, INSUFFICIENT, UNKNOWN>",
      "location_match": "<one of: EXACT, REMOTE_COMPATIBLE, SAME_REGION, DIFFERENT>",
      "visa_status": "NO_REQUIREMENT",
      "risk_summary": "<short string summarizing the risk or PASS>",
      "strengths": "<short string summarizing strengths>",
      "gaps": "<short string summarizing gaps>",
      "seniority_match": "<short string comparing seniorities>",
      "candidate_seniority": "<one of: JUNIOR, MID_LEVEL, SENIOR, LEAD>",
      "job_seniority": "<one of: JUNIOR, MID_LEVEL, SENIOR, LEAD>"
    }
  ]
}

TIER GUIDELINES:
- TIER_1: 90-100% (Best Fit) -> INTERVIEW_IMMEDIATELY
- TIER_2: 75-89% (Good Fit) -> INTERVIEW
- TIER_3: 60-74% (Acceptable) -> CONSIDER_CAUTION
- TIER_4: <60% (Poor Fit) -> PASS

IMPORTANT: Make sure you include EVERY candidate from the input array in your output array. Do not miss any candidates. Output strictly valid JSON.
`;

    const userPrompt = `
JOB DETAILS:
Title: ${job.job_title}
Experience Required: ${job.experience}
Skills Required: ${job.skills}
Location: ${job.location}

CANDIDATES (JSON):
${JSON.stringify(candidatePayload)}

Evaluate the candidates and return the JSON object as requested.
    `;

    const groqPayload = {
      model: "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    };

    const response = await new Promise<any>((resolve, reject) => {
      enqueueGroq(async () => {
        let res;
        let retries = 4;
        for (let i = 0; i <= retries; i++) {
          const { key: apiKey, index, total } = getNextGroqKey();
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(groqPayload)
          });

          if (res.status === 429 && i < retries) {
            const errorData = await res.clone().json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || '';
            const match = errorMessage.match(/try again in ([\d.]+)s/);
            let waitTime = 500;
            if (match && match[1]) {
              waitTime = parseFloat(match[1]) * 1000 + 500;
            }

            console.warn(`Groq rate limit hit on Key ${index + 1}/${total}.`);
            
            if (i >= total - 1 && waitTime > 500) {
              console.warn(`All keys exhausted. Sleeping for ${waitTime}ms to respect rate limit...`);
              await new Promise(r => setTimeout(r, waitTime));
            } else {
              console.warn(`Swapping to next key... (Attempt ${i + 1}/${retries})`);
              await new Promise(r => setTimeout(r, 500));
            }
            continue;
          }
          break;
        }
        resolve(res);
      });
    });

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Groq API request failed with status ${response?.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Log token usage securely in the background
    if (data.usage) {
      supabase.from('system_logs').insert([{
        event_type: 'AI_TOKEN_USAGE',
        metadata: {
          route: '/score',
          job_id: job.id,
          candidates_scored: candidates.length,
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens
        }
      }]).then(({ error }) => {
        if (error) console.error("Failed to log tokens:", error);
      });
    }

    const parsedData = JSON.parse(content);
    const scoredList = parsedData.scored_candidates || [];

    // Merge AI scores with original candidate objects
    const finalCandidates = candidates.map(c => {
      const score = scoredList.find((s: any) => s.id === c.id);
      if (score) {
        return { ...c, ...score };
      }
      // Fallback if AI missed a candidate
      return {
        ...c,
        match_percentage: 0,
        tier: 'TIER_4',
        decision: 'PASS',
        must_haves_passed: false,
        skill_coverage: 0,
        experience_adequacy: 'UNKNOWN',
        location_match: 'DIFFERENT',
        visa_status: 'UNKNOWN',
        risk_summary: 'AI failed to score',
        strengths: 'None',
        gaps: 'Unknown',
        seniority_match: 'UNKNOWN',
        candidate_seniority: 'JUNIOR',
        job_seniority: 'JUNIOR'
      };
    });

    // Sort by match_percentage descending
    finalCandidates.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));

    res.json({ candidates: finalCandidates.slice(0, 50) });
  } catch (error) {
    console.error("Matching Error:", error);
    res.status(500).json({ error: "An error occurred during AI matching." });
  }
});

router.post('/score-jobs', async (req, res) => {
  try {
    const { candidate, jobs } = req.body;
    
    if (!candidate || !jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: "Invalid payload. Expected { candidate, jobs: [] }" });
    }

    // Prepare a simplified payload of jobs to save tokens
    const jobPayload = jobs.map((j: any) => ({
      id: j.id,
      title: j.job_title,
      skills: j.skills,
      experience: j.experience,
      location: j.location,
      role_overview: j.role_overview
    }));

    const systemPrompt = `
You are an expert AI Technical Recruiter. 
Your task is to intelligently evaluate a list of Job Openings against a given Candidate.
The candidate may only provide a generic role (e.g., "Fullstack Developer") instead of a granular list of skills. You MUST infer the implicit skills associated with their role and intelligently score how well the candidate fits each job requirement.

You must return a strictly formatted JSON object matching this schema exactly:
{
  "scored_jobs": [
    {
      "id": "job_id_here",
      "match_percentage": <number between 0 and 100>,
      "tier": "<one of: TIER_1, TIER_2, TIER_3, TIER_4>",
      "decision": "<one of: SUBMIT_IMMEDIATELY, SUBMIT, CONSIDER_CAUTION, PASS>",
      "must_haves_passed": <boolean>,
      "skill_coverage": <number between 0 and 100>,
      "experience_adequacy": "<one of: EXCEEDS, ACCEPTABLE, INSUFFICIENT, UNKNOWN>",
      "location_match": "<one of: EXACT, REMOTE_COMPATIBLE, SAME_REGION, DIFFERENT>",
      "visa_status": "NO_REQUIREMENT",
      "risk_summary": "<short string summarizing the risk or PASS>",
      "strengths": "<short string summarizing strengths>",
      "gaps": "<short string summarizing gaps>",
      "seniority_match": "<short string comparing seniorities>",
      "candidate_seniority": "<one of: JUNIOR, MID_LEVEL, SENIOR, LEAD>",
      "job_seniority": "<one of: JUNIOR, MID_LEVEL, SENIOR, LEAD>"
    }
  ]
}

TIER GUIDELINES:
- TIER_1: 90-100% (Best Fit) -> SUBMIT_IMMEDIATELY
- TIER_2: 75-89% (Good Fit) -> SUBMIT
- TIER_3: 60-74% (Acceptable) -> CONSIDER_CAUTION
- TIER_4: <60% (Poor Fit) -> PASS

IMPORTANT: Make sure you include EVERY job from the input array in your output array. Do not miss any jobs. Output strictly valid JSON.
`;

    const userPrompt = `
CANDIDATE DETAILS:
Name: ${candidate.name}
Role/Skills: ${candidate.skills}
Experience: ${candidate.experience}
Location: ${candidate.location}

JOB OPENINGS (JSON):
${JSON.stringify(jobPayload)}

Evaluate the jobs against this candidate and return the JSON object as requested.
    `;

    const groqPayload = {
      model: "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    };

    const response = await new Promise<any>((resolve, reject) => {
      enqueueGroq(async () => {
        let res;
        let retries = 4;
        for (let i = 0; i <= retries; i++) {
          const { key: apiKey, index, total } = getNextGroqKey();
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(groqPayload)
          });

          if (res.status === 429 && i < retries) {
            const errorData = await res.clone().json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || '';
            const match = errorMessage.match(/try again in ([\d.]+)s/);
            let waitTime = 500;
            if (match && match[1]) {
              waitTime = parseFloat(match[1]) * 1000 + 500;
            }

            console.warn(`Groq rate limit hit on Key ${index + 1}/${total}.`);
            
            if (i >= total - 1 && waitTime > 500) {
              console.warn(`All keys exhausted. Sleeping for ${waitTime}ms to respect rate limit...`);
              await new Promise(r => setTimeout(r, waitTime));
            } else {
              console.warn(`Swapping to next key... (Attempt ${i + 1}/${retries})`);
              await new Promise(r => setTimeout(r, 500));
            }
            continue;
          }
          break;
        }
        resolve(res);
      });
    });

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Groq API request failed with status ${response?.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Log token usage securely in the background
    if (data.usage) {
      supabase.from('system_logs').insert([{
        event_type: 'AI_TOKEN_USAGE',
        metadata: {
          route: '/score-jobs',
          candidate_id: candidate.id,
          jobs_scored: jobs.length,
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens
        }
      }]).then(({ error }) => {
        if (error) console.error("Failed to log tokens:", error);
      });
    }

    const parsedData = JSON.parse(content);
    const scoredList = parsedData.scored_jobs || [];

    // Merge AI scores with original job objects
    const finalJobs = jobs.map((j: any) => {
      const score = scoredList.find((s: any) => s.id === j.id);
      if (score) {
        return { ...j, score: score.match_percentage, matchData: score };
      }
      // Fallback if AI missed a job
      return {
        ...j,
        score: 0,
        matchData: {
          match_percentage: 0,
          tier: 'TIER_4',
          decision: 'PASS',
          must_haves_passed: false,
          skill_coverage: 0,
          experience_adequacy: 'UNKNOWN',
          location_match: 'DIFFERENT',
          visa_status: 'UNKNOWN',
          risk_summary: 'AI failed to score',
          strengths: 'None',
          gaps: 'Unknown',
          seniority_match: 'UNKNOWN',
          candidate_seniority: 'UNKNOWN',
          job_seniority: 'UNKNOWN'
        }
      };
    });

    // Sort by match_percentage descending
    finalJobs.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    res.json({ jobs: finalJobs.slice(0, 50) });
  } catch (error) {
    console.error("Reverse Matching Error:", error);
    res.status(500).json({ error: "An error occurred during AI reverse matching." });
  }
});

export default router;
