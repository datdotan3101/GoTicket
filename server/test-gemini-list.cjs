require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await models.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(m.name));
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }
}

test();
