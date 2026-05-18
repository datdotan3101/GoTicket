import dotenv from 'dotenv';
dotenv.config();

import { query } from './src/config/db.js';
import { aiService } from './src/modules/ai/ai.service.js';

async function testAI() {
  try {
    // Lấy 1 user bất kỳ trong DB để làm userId
    const userRes = await query("SELECT id, email FROM users LIMIT 1");
    if (userRes.rowCount === 0) {
      console.error("No users found in database to run test.");
      process.exit(1);
    }
    const user = userRes.rows[0];
    console.log(`Using user: ${user.email} (ID: ${user.id})`);

    const messages = [
      { role: "user", content: "Chào bạn! Có trận đấu nào hot sắp tới không?" }
    ];

    console.log("\n--- Sending request to AI Chatbot... ---");
    console.time("AI_Response_Time");
    const result = await aiService.chat(user.id, messages);
    console.timeEnd("AI_Response_Time");

    console.log("\n--- Chatbot Response ---");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Error during AI test:", error);
  } finally {
    process.exit(0);
  }
}

testAI();
