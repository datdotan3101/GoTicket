import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { getUsers, toggleUserActive, updateUserRole } from "./users.controller.js";

const router = Router();

router.get("/", auth, requireRoles(ROLES.ADMIN), getUsers);
router.put("/:id/role", auth, requireRoles(ROLES.ADMIN), updateUserRole);
router.put("/:id/active", auth, requireRoles(ROLES.ADMIN), toggleUserActive);

export default router;
