import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { getNotifications, markNotificationRead } from "./notifications.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: "In-app realtime notifications (Socket.IO + REST poll)"
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: "My notifications list (all roles)"
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: "List of notifications, sorted by most recent"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 */
router.get("/", auth, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: "Mark notification as read (all roles)"
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       404:
 *         description: "Notification not found"
 */
router.put("/:id/read", auth, markNotificationRead);

export default router;
