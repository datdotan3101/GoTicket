import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient;

/**
 * Get Gemini client (lazy init).
 * Returns null if GEMINI_API_KEY is not configured.
 */
export const getGemini = () => {
  if (geminiClient) return geminiClient;
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return geminiClient;
};
