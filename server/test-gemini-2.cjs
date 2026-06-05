require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "You are a ticket advisor.",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: "Hi, how can I help?" }] }
      ]
    });
    
    const result = await chat.sendMessage("I want to buy cong an ha noi");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }
}

test();
