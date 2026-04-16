import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createLeague, deleteLeague, getLeagueById, getLeagues, updateLeague } from "./leagues.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leagues
 *   description: "League management (Admin creates, public read)"
 */

/**
 * @swagger
 * /api/leagues:
 *   get:
 *     summary: "List of leagues (public)"
 *     tags: [Leagues]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sportId
 *         schema: { type: integer }
 *         description: "Filter by sport"
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: "Filter by active/inactive (default true)"
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
router.get("/", getLeagues);

/**
 * @swagger
 * /api/leagues/{id}:
 *   get:
 *     summary: "League details (public)"
 *     tags: [Leagues]
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
router.get("/:id", getLeagueById);

/**
 * @swagger
 * /api/leagues:
 *   post:
 *     summary: "Create a new league (admin only)"
 *     tags: [Leagues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               sportId: { type: integer }
 *               season: { type: string, example: "2024-2025" }
 *               logoUrl: { type: string }
 *     responses:
 *       201:
 *         description: "Created successfully"
 */
router.post("/", auth, requireRoles(ROLES.ADMIN), createLeague);

/**
 * @swagger
 * /api/leagues/{id}:
 *   put:
 *     summary: "Update league (admin only)"
 *     tags: [Leagues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               sportId: { type: integer }
 *               season: { type: string }
 *               logoUrl: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 */
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateLeague);

/**
 * @swagger
 * /api/leagues/{id}:
 *   delete:
 *     summary: "Delete league (admin only)"
 *     tags: [Leagues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Deleted successfully"
 *       404:
 *         description: "Not found"
 */
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteLeague);

export default router;
