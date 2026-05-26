import Groq from "groq-sdk";

let groqClient;

/**
 * Get Groq client (lazy init).
 * Returns null if GROQ_API_KEY is not configured.
 */
export const getGroq = () => {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
};
