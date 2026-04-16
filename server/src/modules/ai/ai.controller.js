import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { aiService } from "./ai.service.js";

/**
 * POST /api/ai/chat
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 */
export const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: "messages là bắt buộc và phải là array." });
  }
  const data = await aiService.chat(req.user.id, messages);
  return sendSuccess(res, data);
});

/**
 * GET /api/ai/recommendations
 * Cache-Control: 5 phút phía client
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const data = await aiService.getRecommendations(req.user.id);
  res.set("Cache-Control", "private, max-age=300");
  return sendSuccess(res, data);
});
