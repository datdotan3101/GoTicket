import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { aiService } from "./ai.service.js";

/**
 * POST /api/ai/chat
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 * Response: { reply, action, data, usage }
 */
export const chat = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return sendError(res, "messages is required and must be an array.", HTTP_STATUS.BAD_REQUEST);
  }
  const result = await aiService.chat(req.user.id, messages);
  return sendSuccess(res, {
    reply: result.message,
    action: result.action || "none",
    data: result.data || null,
    provider: result.provider
  });
});

/**
 * GET /api/ai/recommendations
 * Cache-Control: 5 minutes on client side
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  const data = await aiService.getRecommendations(req.user.id);
  res.set("Cache-Control", "private, max-age=300");
  return sendSuccess(res, data);
});
