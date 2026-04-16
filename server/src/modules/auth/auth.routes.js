import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { runValidation } from "../../middlewares/validate.js";
import { login, me, onboarding, register } from "./auth.controller.js";
import { loginRules, onboardingRules, registerRules } from "./auth.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: "User authentication"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: "Register new account (status pending — wait for admin approval)"
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               fullName: { type: string }
 *               phone: { type: string, example: "0901234567" }
 *     responses:
 *       201:
 *         description: "Registered successfully, waiting for admin approval"
 *       400:
 *         description: "Invalid data"
 *       409:
 *         description: "Email already exists"
 */
router.post("/register", runValidation(registerRules), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: "Login"
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: "Login successful"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         email: { type: string }
 *                         full_name: { type: string }
 *                         role: { type: string, enum: [admin, manager, editor, audience, checker] }
 *       401:
 *         description: "Invalid email or password"
 *       403:
 *         description: "Account is pending approval or locked"
 */
router.post("/login", runValidation(loginRules), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: "Get current user profile (from token)"
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: "Success"
 *       401:
 *         description: "Unauthorized"
 */
router.get("/me", auth, me);

/**
 * @swagger
 * /api/auth/onboarding:
 *   post:
 *     summary: "Save favorite sports during onboarding"
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primarySportId: { type: integer }
 *               secondarySportId: { type: integer }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 */
router.post("/onboarding", auth, runValidation(onboardingRules), onboarding);

export default router;
