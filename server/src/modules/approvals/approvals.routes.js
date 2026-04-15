import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { approve, pendingApprovals, reject } from "./approvals.controller.js";

const router = Router();

router.get("/pending", auth, requireRoles(ROLES.ADMIN), pendingApprovals);
router.post("/:id/approve", auth, requireRoles(ROLES.ADMIN), approve);
router.post("/:id/reject", auth, requireRoles(ROLES.ADMIN), reject);

export default router;
