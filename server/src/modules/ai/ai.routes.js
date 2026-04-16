import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { chat, getRecommendations } from "./ai.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Groq Llama AI chatbot và recommendation
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: "Chat with AI assistant (auth required)"
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *                 description: "Chat history (up to 10 most recent messages)"
 *                 items:
 *                   type: object
 *                   required: [role, content]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *           example:
 *             messages:
 *               - role: "user"
 *                 content: "Are there any upcoming football matches?"
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string }
 *                     usage:
 *                       type: object
 *                       properties:
 *                         prompt_tokens: { type: integer }
 *                         completion_tokens: { type: integer }
 *       503:
 *         description: "AI service not configured"
 */
router.post("/chat", auth, chat);

/**
 * @swagger
 * /api/ai/recommendations:
 *   get:
 *     summary: "Recommend matches based on user preferences (5-minute cache)"
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: "List of recommended matches (max 6 matches)"
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: private, max-age=300
 */
router.get("/recommendations", auth, getRecommendations);

export default router;
