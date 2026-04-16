import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { adminRevenue, managerRevenue, matchAnalytics } from "./dashboard.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: "Analytics and revenue reports"
 */

/**
 * @swagger
 * /api/dashboard/admin/revenue:
 *   get:
 *     summary: "System-wide revenue (admin only)"
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: "System revenue statistics"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_revenue: { type: number }
 *                         total_tickets: { type: integer }
 *                         total_matches_with_sales: { type: integer }
 *                         total_buyers: { type: integer }
 *                     bySport:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sport_name: { type: string }
 *                           revenue: { type: number }
 *                           tickets: { type: integer }
 *                     topMatches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           home_team: { type: string }
 *                           away_team: { type: string }
 *                           revenue: { type: number }
 *                     revenueTrend:
 *                       type: array
 *                       description: "Daily revenue for the last 30 days"
 */
router.get("/admin/revenue", auth, requireRoles(ROLES.ADMIN), adminRevenue);

/**
 * @swagger
 * /api/dashboard/manager/revenue:
 *   get:
 *     summary: "Manager's club revenue (club_id from JWT)"
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: "Club revenue statistics"
 *       403:
 *         description: "Manager not assigned to any club"
 */
router.get("/manager/revenue", auth, requireRoles(ROLES.MANAGER), managerRevenue);

/**
 * @swagger
 * /api/dashboard/manager/match/{id}:
 *   get:
 *     summary: "Detailed match analytics (manager — only matches of their club)"
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Match ID
 *     responses:
 *       200:
 *         description: |
 *           Analytics include: byStand (fill rate, revenue, checkin per stand),
 *           checkinStats (total tickets / checked_in), peakHours (histogram of ticket purchase times)
 *       403:
 *         description: "Match does not belong to the manager's club"
 *       404:
 *         description: "Match not found"
 */
router.get("/manager/match/:id", auth, requireRoles(ROLES.MANAGER), matchAnalytics);

export default router;
