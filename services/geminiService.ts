import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// In a real app, ensure process.env.API_KEY is available.
// For this demo, we assume the user might not have set it, so we handle errors gracefully or mock if missing.
const apiKey = process.env.API_KEY || 'dummy-key'; 
const ai = new GoogleGenAI({ apiKey });

export const analyzeCallNotes = async (notes: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return new Promise(resolve => setTimeout(() => resolve("Simulated Analysis: The customer seems interested. Recommended action: Follow up in 2 days with a demo."), 1500));
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following call notes from a CRM system. 
      Provide a concise summary, the customer's sentiment (Positive, Neutral, Negative), and a recommended next step for the agent.
      
      Notes: "${notes}"
      
      Output format:
      **Summary**: ...
      **Sentiment**: ...
      **Next Step**: ...`,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing notes. Please check API key configuration.";
  }
};
