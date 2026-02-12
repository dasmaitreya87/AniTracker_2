import { GoogleGenAI } from "@google/genai";
import { UserAnimeEntry } from "../types";

// Safety check for API key availability without crashing the app immediately
const getClient = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateTasteProfile = async (library: UserAnimeEntry[]): Promise<string> => {
  const ai = getClient();
  if (!ai || library.length === 0) return "Add some anime to your library to get an AI taste analysis!";

  const watched = library.map(l => `${l.metadata.title.english || l.metadata.title.romaji} (${l.score}/10)`).join(", ");
  
  const prompt = `
    Analyze the following list of anime watched by a user and their ratings:
    ${watched}
    
    In 3 concise sentences, describe their "Otaku Personality". 
    Then, suggest ONE genre they might be overlooking but would enjoy.
    Keep the tone fun and slightly geeky.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (e) {
    console.error("Gemini Error:", e);
    return "AI is taking a nap. Try again later.";
  }
};

export const generateAnimeBlurb = async (title: string, description: string): Promise<string[]> => {
    const ai = getClient();
    if (!ai) return ["Studio details unavailable", "Year unavailable", "Check online for more info"];

    const prompt = `
      Create 3 short, punchy, "selling points" (bullet points) for the anime "${title}".
      Use the provided description for context if needed: "${description.substring(0, 200)}..."
      
      Rules:
      - Max 5-6 words per bullet.
      - Focus on vibes (e.g., "Mind-bending plot twists", "Stunning animation", "Cozy slice-of-life").
      - Return ONLY the 3 bullets separated by newlines. No dashes.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const text = response.text || "";
      return text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (e) {
      console.error("Gemini Blurb Error:", e);
      return ["Popular series", "High ratings", "Community favorite"];
    }
};
