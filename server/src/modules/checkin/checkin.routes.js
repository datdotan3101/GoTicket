import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { matchStats, scanCheckin } from "./checkin.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Checkin
 *   description: "QR code check-in for tickets (Checker only)"
 */

/**
 * @swagger
 * /api/checkin/scan:
 *   post:
 *     summary: "Scan QR code to check-in ticket (checker)"
 *     tags: [Checkin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrToken]
 *             properties:
 *               qrToken:
 *                 type: string
 *                 description: "JWT QR token from ticket (scanned from QR code)"
 *     responses:
 *       200:
 *         description: "Check-in successful"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticketId: { type: integer }
 *                     matchId: { type: integer }
 *                     seatId: { type: integer }
 *                     status: { type: string, example: "checked_in" }
 *       400:
 *         description: "Ticket is not in paid status or QR token has expired"
 *       401:
 *         description: "Invalid QR token"
 */
router.post("/scan", auth, requireRoles(ROLES.CHECKER), scanCheckin);

/**
 * @swagger
 * /api/checkin/match/{id}/stats:
 *   get:
 *     summary: "Match check-in statistics (checker — realtime)"
 *     tags: [Checkin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Match ID
 *     responses:
 *       200:
 *         description: "Check-in statistics"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tickets: { type: integer }
 *                 checked_in_tickets: { type: integer }
 *                 not_checked_in_tickets: { type: integer }
 */
router.get("/match/:id/stats", auth, requireRoles(ROLES.CHECKER), matchStats);

export default router;
