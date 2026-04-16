import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { runValidation } from "../../middlewares/validate.js";
import { bookTickets, myTickets } from "./tickets.controller.js";
import { bookTicketsRules } from "./tickets.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: "Ticket booking and management"
 */

/**
 * @swagger
 * /api/tickets/book:
 *   post:
 *     summary: "Book tickets (audience — max 6 seats/order)"
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, seatIds]
 *             properties:
 *               matchId:
 *                 type: integer
 *               seatIds:
 *                 type: array
 *                 items: { type: integer }
 *                 minItems: 1
 *                 maxItems: 6
 *     responses:
 *       201:
 *         description: "Tickets booked successfully, returns list of pending tickets"
 *       400:
 *         description: "Seats are already booked / violated consecutive seating rule"
 *       409:
 *         description: "Seat conflict"
 */
router.post("/book", auth, requireRoles(ROLES.AUDIENCE), runValidation(bookTicketsRules), bookTickets);

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: "My tickets list (audience)"
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: "List of tickets with seat_label, match info, and qr_token"
 */
router.get("/my", auth, requireRoles(ROLES.AUDIENCE), myTickets);

export default router;
