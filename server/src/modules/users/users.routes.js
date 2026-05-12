import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { runValidation } from "../../middlewares/validate.js";
import { getUsers, getPendingUsers, getUserById, toggleUserActive, updateUserRole, createUser } from "./users.controller.js";
import { createUserRules } from "./users.validation.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: "User management (Admin only)"
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: "List of all users (admin)"
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, editor, audience, checker]
 *         description: "Filter by role"
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: "Filter by active/inactive status"
 *       - in: query
 *         name: isApproved
 *         schema: { type: boolean }
 *         description: "Filter by approval status"
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Search by email or name"
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/", auth, requireRoles(ROLES.ADMIN), getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: "Admin create user directly (status active & approved)"
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               fullName: { type: string }
 *               role: { type: string, enum: [admin, manager, editor, audience, checker] }
 *               clubId: { type: integer }
 *     responses:
 *       201:
 *         description: "User created"
 *       400:
 *         description: "Invalid data"
 *       409:
 *         description: "Email already exists"
 */
router.post("/", auth, requireRoles(ROLES.ADMIN), runValidation(createUserRules), createUser);

/**
 * @swagger
 * /api/users/pending:
 *   get:
 *     summary: "List of users pending account approval (admin)"
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "Success"
 */
router.get("/pending", auth, requireRoles(ROLES.ADMIN), getPendingUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: "User details (admin)"
 *     tags: [Users]
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
router.get("/:id", auth, requireRoles(ROLES.ADMIN), getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: "Update user's role and club (admin)"
 *     tags: [Users]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, manager, editor, audience, checker]
 *               clubId:
 *                 type: integer
 *                 description: "Required when role = manager"
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       400:
 *         description: "Invalid role or missing clubId for manager"
 */
router.put("/:id/role", auth, requireRoles(ROLES.ADMIN), updateUserRole);

/**
 * @swagger
 * /api/users/{id}/active:
 *   put:
 *     summary: "Lock or unlock user account (admin)"
 *     tags: [Users]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: "true = unlock, false = lock"
 *     responses:
 *       200:
 *         description: "Updated successfully"
 *       404:
 *         description: "Not found"
 */
router.put("/:id/active", auth, requireRoles(ROLES.ADMIN), toggleUserActive);

export default router;
