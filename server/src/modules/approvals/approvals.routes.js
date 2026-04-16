import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { runValidation } from "../../middlewares/validate.js";
import { approve, getApprovalDetail, pendingApprovals, reject } from "./approvals.controller.js";
import { rejectApprovalRules } from "./approvals.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Approvals
 *   description: "Admin approval workflow — match, news, user_account"
 */

/**
 * @swagger
 * /api/approvals/pending:
 *   get:
 *     summary: "List of pending approvals (admin)"
 *     tags: [Approvals]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [match, news, user_account]
 *         description: "Filter by resource type"
 *     responses:
 *       200:
 *         description: "List of pending approvals"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       resource_type: { type: string, enum: [match, news, user_account] }
 *                       resource_id: { type: integer }
 *                       submitted_by: { type: integer }
 *                       submitted_by_email: { type: string }
 *                       submitted_by_name: { type: string }
 *                       status: { type: string, enum: [pending, approved, rejected] }
 *                       scheduled_publish_at: { type: string, format: date-time }
 *                       created_at: { type: string, format: date-time }
 */
router.get("/pending", auth, requireRoles(ROLES.ADMIN), pendingApprovals);

/**
 * @swagger
 * /api/approvals/{id}:
 *   get:
 *     summary: "Approval details with resource information (admin)"
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Approval details and related resource"
 *       404:
 *         description: "Not found"
 */
router.get("/:id", auth, requireRoles(ROLES.ADMIN), getApprovalDetail);

/**
 * @swagger
 * /api/approvals/{id}/approve:
 *   post:
 *     summary: "Approve a resource (admin)"
 *     tags: [Approvals]
 *     description: |
 *       - resource_type = match/news + has scheduled_publish_at → status = 'approved', cron will publish on time
 *       - resource_type = match/news + NO scheduled_publish_at → publish immediately (status = 'published')
 *       - resource_type = user_account → is_approved = true, user can log in
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Approved successfully"
 *       400:
 *         description: "Approval has already been processed"
 *       404:
 *         description: "Not found"
 */
router.post("/:id/approve", auth, requireRoles(ROLES.ADMIN), approve);

/**
 * @swagger
 * /api/approvals/{id}/reject:
 *   post:
 *     summary: "Reject approval with reason (admin)"
 *     tags: [Approvals]
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: "Reason for rejection (required)"
 *                 example: "Inappropriate content, please edit the title."
 *     responses:
 *       200:
 *         description: "Rejected successfully"
 *       400:
 *         description: "Missing rejection reason"
 *       404:
 *         description: "Not found"
 */
router.post("/:id/reject", auth, requireRoles(ROLES.ADMIN), runValidation(rejectApprovalRules), reject);

export default router;
