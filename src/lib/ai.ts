import { GoogleGenAI } from "@google/genai";

export async function generateContent(apiKey: string, text: string, systemPrompt: string, apiEndpoint?: string): Promise<string> {
  if (apiKey.startsWith('sk-')) {
    const url = apiEndpoint || 'https://api.deepseek.com/chat/completions';
    const res = await fetch(url, {
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
    const options: any = { apiKey };
    if (apiEndpoint) {
      options.baseUrl = apiEndpoint;
    }
    const ai = new GoogleGenAI(options);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash",
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
