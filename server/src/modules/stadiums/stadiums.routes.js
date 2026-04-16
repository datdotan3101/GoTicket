import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createStadium, deleteStadium, getStadiumById, getStadiums, updateStadium } from "./stadiums.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stadiums
 *   description: "Stadium management (Admin creates, public read)"
 */

/**
 * @swagger
 * /api/stadiums:
 *   get:
 *     summary: "List of stadiums (public)"
 *     tags: [Stadiums]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Search by name or city"
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/", getStadiums);

/**
 * @swagger
 * /api/stadiums/{id}:
 *   get:
 *     summary: "Stadium details (public)"
 *     tags: [Stadiums]
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
router.get("/:id", getStadiumById);

/**
 * @swagger
 * /api/stadiums:
 *   post:
 *     summary: "Create a new stadium (admin only)"
 *     tags: [Stadiums]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               city: { type: string }
 *               address: { type: string }
 *               imageUrl: { type: string, description: "Stadium image URL from Cloudinary" }
 *     responses:
 *       201:
 *         description: "Created successfully"
 */
router.post("/", auth, requireRoles(ROLES.ADMIN), createStadium);

/**
 * @swagger
 * /api/stadiums/{id}:
 *   put:
 *     summary: "Update stadium (admin only)"
 *     tags: [Stadiums]
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
 *               city: { type: string }
 *               address: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 */
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateStadium);

/**
 * @swagger
 * /api/stadiums/{id}:
 *   delete:
 *     summary: "Delete stadium (admin only)"
 *     tags: [Stadiums]
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
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteStadium);

export default router;
