import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { runValidation } from "../../middlewares/validate.js";
import {
  configureStands,
  createMatch,
  getMatchById,
  getMatchSeats,
  getMatches,
  previewStands,
  submitMatch
} from "./matches.controller.js";
import { configStandsRules, createMatchRules } from "./matches.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Matches
 *   description: "Match management"
 */

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: "List of matches (public)"
 *     tags: [Matches]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, pending_review, approved, upcoming, published, ongoing, finished, cancelled] }
 *       - in: query
 *         name: league_id
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/", getMatches);

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: "Match details (public)"
 *     tags: [Matches]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Success"
 *       404:
 *         description: "Not found"
 */
router.get("/:id", getMatchById);

/**
 * @swagger
 * /api/matches/{id}/seats:
 *   get:
 *     summary: "Match seat map (public — realtime)"
 *     tags: [Matches]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "List of seats with status and price"
 */
router.get("/:id/seats", getMatchSeats);

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: "Create a new match (manager — own club)"
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [homeTeam, awayTeam, matchDate, stadiumId, leagueId]
 *             properties:
 *               homeTeam: { type: string }
 *               awayTeam: { type: string }
 *               matchDate: { type: string, format: date-time }
 *               stadiumId: { type: integer }
 *               leagueId: { type: integer }
 *               ticketSaleOpenAt: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: "Created successfully"
 *       400:
 *         description: "Invalid data"
 */
router.post("/", auth, requireRoles(ROLES.MANAGER), runValidation(createMatchRules), createMatch);

/**
 * @swagger
 * /api/matches/{id}/submit:
 *   post:
 *     summary: "Submit match for admin approval (manager)"
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Submitted successfully"
 */
router.post("/:id/submit", auth, requireRoles(ROLES.MANAGER), submitMatch);

/**
 * @swagger
 * /api/matches/stands/preview:
 *   post:
 *     summary: "Preview seat configuration before saving (manager)"
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalCapacity, prices]
 *             properties:
 *               totalCapacity: { type: integer, minimum: 100, maximum: 100000 }
 *               prices:
 *                 type: object
 *                 properties:
 *                   A: { type: number }
 *                   B: { type: number }
 *                   C: { type: number }
 *                   D: { type: number }
 *     responses:
 *       200:
 *         description: "Preview of 4 stands with rows × seats_per_row"
 */
router.post("/stands/preview", auth, requireRoles(ROLES.MANAGER), runValidation(configStandsRules), previewStands);

/**
 * @swagger
 * /api/matches/{id}/stands:
 *   put:
 *     summary: "Configure seats + pricing and batch generate seats (manager)"
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalCapacity, prices]
 *             properties:
 *               totalCapacity: { type: integer }
 *               prices:
 *                 type: object
 *                 properties:
 *                   A: { type: number }
 *                   B: { type: number }
 *                   C: { type: number }
 *                   D: { type: number }
 *     responses:
 *       200:
 *         description: "Seats generated successfully in batch"
 */
router.put("/:id/stands", auth, requireRoles(ROLES.MANAGER), runValidation(configStandsRules), configureStands);

export default router;
