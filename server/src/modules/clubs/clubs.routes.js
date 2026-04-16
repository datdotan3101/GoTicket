import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createClub, deleteClub, getClubById, getClubs, updateClub } from "./clubs.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clubs
 *   description: "Club management (Admin creates, public read)"
 */

/**
 * @swagger
 * /api/clubs:
 *   get:
 *     summary: "List of clubs (public)"
 *     tags: [Clubs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sportId
 *         schema: { type: integer }
 *         description: "Filter by sport"
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/", getClubs);

/**
 * @swagger
 * /api/clubs/{id}:
 *   get:
 *     summary: "Club details (public)"
 *     tags: [Clubs]
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
router.get("/:id", getClubById);

/**
 * @swagger
 * /api/clubs:
 *   post:
 *     summary: "Create a new club (admin only)"
 *     tags: [Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               logoUrl: { type: string }
 *               sportId: { type: integer }
 *     responses:
 *       201:
 *         description: "Created successfully"
 */
router.post("/", auth, requireRoles(ROLES.ADMIN), createClub);

/**
 * @swagger
 * /api/clubs/{id}:
 *   put:
 *     summary: "Update club (admin only)"
 *     tags: [Clubs]
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
 *               logoUrl: { type: string }
 *               sportId: { type: integer }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 */
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateClub);

/**
 * @swagger
 * /api/clubs/{id}:
 *   delete:
 *     summary: "Delete club (admin only)"
 *     tags: [Clubs]
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
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteClub);

export default router;
