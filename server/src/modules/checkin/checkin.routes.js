import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { matchStats, scanCheckin } from "./checkin.controller.js";

const router = Router();

router.post("/scan", auth, requireRoles(ROLES.CHECKER), scanCheckin);
router.get("/match/:id/stats", auth, requireRoles(ROLES.CHECKER), matchStats);

export default router;
