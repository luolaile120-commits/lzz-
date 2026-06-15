import { GoogleGenAI } from "@google/genai";

export async function generateContent(apiKey: string, text: string, systemPrompt: string): Promise<string> {
  if (apiKey.startsWith('sk-')) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.1
      })
    });
    if (!res.ok) {
      throw new Error("API Exception: " + res.statusText);
    }
    const json = await res.json();
    return json.choices[0].message.content || "";
  } else {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    return response.text || "";
  }
}
