import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ override: true });

async function testImage() {
  console.log("Testing image extraction...");
  const fileData = fs.readFileSync('../hotlistimg.png');
  const base64Image = `data:image/png;base64,${fileData.toString('base64')}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", 
        messages: [
          { role: "system", content: "You are an expert AI data extraction assistant. Return ONLY a valid JSON array of objects representing the candidates with fields: name, email, skills, experience, location." },
          { role: "user", content: [
            { type: "text", text: "Extract candidate data from this image." },
            { type: "image_url", image_url: { url: base64Image } }
          ]}
        ],
        temperature: 0.1
      })
    });
  const text = await response.text();
  console.log("Image Parse Result HTTP Status:", response.status);
  try {
    const json = JSON.parse(text);
    console.log("Response JSON:", JSON.stringify(json, null, 2).slice(0, 500) + '...');
  } catch (e) {
    console.log("Response text:", text);
  }
}

testImage();