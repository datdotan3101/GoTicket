import { Router } from "express";
import { body } from "express-validator";
import { auth } from "../../middlewares/auth.js";
import { login, me, onboarding, register } from "./auth.controller.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản audience
 *     security: []
 */
router.post(
  "/register",
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").notEmpty()
  ],
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     security: []
 */
router.post("/login", [body("email").isEmail(), body("password").notEmpty()], login);
router.get("/me", auth, me);
router.post("/onboarding", auth, onboarding);

export default router;
