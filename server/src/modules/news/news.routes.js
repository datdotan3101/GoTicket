import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { runValidation } from "../../middlewares/validate.js";
import {
  createNews,
  deleteNews,
  getMyNews,
  getNews,
  getNewsById,
  getNewsBySlug,
  submitNews,
  updateNews
} from "./news.controller.js";
import { createNewsRules, updateNewsRules } from "./news.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: News
 *   description: "Sports news management"
 */

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: "List of published news (public)"
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sportId
 *         schema: { type: integer }
 *         description: "Filter by sport"
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Search by title"
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
router.get("/", getNews);

/**
 * @swagger
 * /api/news/my:
 *   get:
 *     summary: "Current editor's articles (all statuses)"
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_review, approved, rejected, published]
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
router.get("/my", auth, requireRoles(ROLES.EDITOR), getMyNews);

/**
 * @swagger
 * /api/news/slug/{slug}:
 *   get:
 *     summary: "Article details by slug (public)"
 *     tags: [News]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "Success"
 *       404:
 *         description: "Not found"
 */
router.get("/slug/:slug", getNewsBySlug);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: "Article details by id (editor/admin)"
 *     tags: [News]
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
router.get("/:id", auth, requireRoles(ROLES.EDITOR, ROLES.ADMIN), getNewsById);

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: "Create a new article (editor)"
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string, description: "HTML rich text from TipTap" }
 *               thumbnailUrl: { type: string }
 *               sportId: { type: integer }
 *               scheduledPublishAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: "Created successfully"
 */
router.post("/", auth, requireRoles(ROLES.EDITOR), runValidation(createNewsRules), createNews);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: "Update article (editor — own articles only, status draft/rejected)"
 *     tags: [News]
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
 *               title: { type: string }
 *               content: { type: string }
 *               thumbnailUrl: { type: string }
 *               sportId: { type: integer }
 *               scheduledPublishAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       404:
 *         description: "Not found or unauthorized"
 */
router.put("/:id", auth, requireRoles(ROLES.EDITOR), runValidation(updateNewsRules), updateNews);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: "Delete article (editor — own articles only, status draft/rejected)"
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Deleted successfully"
 *       404:
 *         description: "Not found or unauthorized"
 */
router.delete("/:id", auth, requireRoles(ROLES.EDITOR), deleteNews);

/**
 * @swagger
 * /api/news/{id}/submit:
 *   post:
 *     summary: "Submit article for admin approval (editor)"
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: "Submitted successfully, status changed to pending_review"
 */
router.post("/:id/submit", auth, requireRoles(ROLES.EDITOR), submitNews);

export default router;
