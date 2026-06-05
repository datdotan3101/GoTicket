require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  console.log("Key:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello!");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }
}

test();
