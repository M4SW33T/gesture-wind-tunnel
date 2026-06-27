import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to prevent errors during initial render if missing
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeAerodynamics = async (focusArea: string): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please configure your Google Gemini API Key.";
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert automotive aerodynamicist reviewing a car design in a wind tunnel.
      The user is testing the airflow around the "${focusArea}" of a futuristic concept sports car.
      
      Provide a brief, technical, yet easy-to-understand analysis (max 100 words) of why aerodynamics are critical in this specific area. 
      Mention concepts like drag coefficient, downforce, turbulence, or laminar flow where appropriate.
      
      Format the output as a clean paragraph without markdown bolding.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Analysis complete. Optimization recommended.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to connect to the aerodynamic analysis engine.";
  }
};
