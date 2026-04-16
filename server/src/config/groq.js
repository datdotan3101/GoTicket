import Groq from "groq-sdk";

let groqClient;

/**
 * Lấy Groq client (lazy init).
 * Trả về null nếu GROQ_API_KEY chưa được cấu hình.
 */
export const getGroq = () => {
  if (groqClient) return groqClient;
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
};
