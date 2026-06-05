require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test(modelName) {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    console.log(`[${modelName}] Response:`, result.response.text());
  } catch (err) {
    console.error(`[${modelName}] Error:`, err.message);
  }
}

async function run() {
  await test("gemini-2.5-flash");
  await test("gemini-flash-latest");
}
run();
