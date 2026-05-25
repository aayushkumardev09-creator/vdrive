
export interface AIResponse {
  content: string;
  error?: string;
}

export async function chatWithGroq(prompt: string, systemPrompt: string = "You are a helpful recruitment assistant."): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return { 
      content: "", 
      error: "Groq API Key not configured. Please add GROQ_API_KEY to your environment/secrets." 
    };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", 
        messages: [
          { role: "system", content: systemPrompt },
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
    return { content: data.choices[0].message.content };
  } catch (error) {
    console.error("Groq AI Error:", error);
    return { 
      content: "", 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}
