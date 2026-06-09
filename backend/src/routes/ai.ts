import { Router } from 'express';

const router = Router();

router.post('/chat', async (req, res) => {
  const { prompt, systemPrompt } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return res.status(500).json({ 
      error: "Groq API Key not configured." 
    });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful recruitment assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    res.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error("Groq AI Error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

router.post('/map-csv', async (req, res) => {
  const { headers, sampleRow } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return res.status(500).json({ error: "Groq API Key not configured." });
  }

  const systemPrompt = `
You are an expert data mapping assistant.
Your task is to map an array of CSV headers to our standardized database schema.

The standardized database schema columns are:
- id
- name
- email
- skills
- experience
- location
- resume
- created_at
- _info

You will be given the CSV headers and a single sample row to help you understand the context of the data.
For each CSV header, return the best matching standard column name.
If a CSV header does not match any of our standard columns, map it to "ignore".

OUTPUT FORMAT:
Return ONLY a valid JSON object where the keys are the exact CSV headers and the values are the mapped standard column names (or "ignore").
Do NOT wrap the JSON in markdown code blocks. Just output raw JSON.
`;

  const prompt = `CSV Headers: ${JSON.stringify(headers)}\nSample Row: ${JSON.stringify(sampleRow)}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please map these headers to the standard schema in JSON format: " + prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    res.json({ mapping: JSON.parse(content) });
  } catch (error) {
    console.error("Groq Mapping Error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

router.post('/parse-image', async (req, res) => {
  const { base64Image } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return res.status(500).json({ error: "Groq API Key not configured." });
  }

  const systemPrompt = `
You are an expert AI data extraction assistant.
Your task is to analyze the provided image, identify candidate data, and extract it directly into our standardized JSON schema.

You MUST map the image's columns to these EXACT JSON keys:
- "name" (Map from Code, Name, Candidate, etc.)
- "email" (Email Address)
- "skills" (Map from Technology, Tech Stack, Skills, etc.)
- "experience" (Years of experience)
- "location" (Location, City, State)
- "resume" (Resume URL/Link)
- "_info" (Any other info like Visa status, Relocation, etc.)

Do NOT use the original column names from the image as keys. ONLY use the 7 keys listed above. If a field is missing, set the value to an empty string "".

OUTPUT FORMAT:
Return ONLY a valid JSON object with a single key "candidates" that contains the array of extracted candidate objects.
Do NOT wrap the JSON in markdown code blocks. Just output raw JSON object.
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: "Extract candidate data from this image and return it as a JSON object." },
            { type: "image_url", image_url: { url: base64Image } }
          ]}
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    
    res.json({ candidates: parsed.candidates || parsed });
  } catch (error) {
    console.error("Groq Vision Error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
});

export default router;
