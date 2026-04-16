import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createPaymentIntent, stripeWebhook } from "./payments.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: "Stripe payments"
 */

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: "Create Stripe PaymentIntent for list of tickets (audience)"
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketIds]
 *             properties:
 *               ticketIds:
 *                 type: array
 *                 items: { type: integer }
 *                 description: "List of ticket IDs (must belong to user and have status=pending)"
 *               currency:
 *                 type: string
 *                 default: vnd
 *     responses:
 *       200:
 *         description: "PaymentIntent created successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: "Use on frontend with Stripe.js to confirm payment"
 *                 paymentIntentId:
 *                   type: string
 *       400:
 *         description: "Invalid ticket payload"
 */
router.post("/create-intent", auth, requireRoles(ROLES.AUDIENCE), createPaymentIntent);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: "Stripe webhook endpoint (no auth needed — called by Stripe automatically)"
 *     tags: [Payments]
 *     security: []
 *     description: |
 *       Process Stripe events:
 *       - `payment_intent.succeeded` → mark tickets paid, generate QR token
 *       - `payment_intent.payment_failed` → mark payment failed
 *
 *       Receives raw body (bypasses JSON parser).
 *       Requires `STRIPE_WEBHOOK_SECRET` in .env.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             description: Stripe event object (raw JSON)
 *     responses:
 *       200:
 *         description: "Webhook received successfully"
 *       400:
 *         description: "Invalid Stripe signature"
 */
router.post("/webhook", stripeWebhook);

export default router;
