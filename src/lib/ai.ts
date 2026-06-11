
export interface AIResponse {
  content: string;
  error?: string;
}

export async function chatWithGroq(prompt: string, systemPrompt: string = "You are a helpful recruitment assistant."): Promise<AIResponse> {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return { content: data.content };
  } catch (error) {
    console.error("Backend AI Error:", error);
    return { 
      content: "", 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}
