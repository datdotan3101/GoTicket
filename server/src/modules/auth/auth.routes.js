import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { runValidation } from "../../middlewares/validate.js";
import { login, me, onboarding, register, updateProfile, changePassword, deleteAccount } from "./auth.controller.js";
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

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: "Update current user's profile (name, email)"
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       400:
 *         description: "Email already taken"
 */
router.put("/profile", auth, updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: "Change password (requires current password)"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: "Password changed successfully"
 *       400:
 *         description: "Current password is incorrect or validation failed"
 */
router.put("/change-password", auth, changePassword);

/**
 * @swagger
 * /api/auth/profile:
 *   delete:
 *     summary: "Delete current user's account"
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: "Account deleted successfully"
 */
router.delete("/profile", auth, deleteAccount);

export default router;
