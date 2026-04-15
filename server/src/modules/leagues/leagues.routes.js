import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createLeague, deleteLeague, getLeagues, updateLeague } from "./leagues.controller.js";

const router = Router();

router.get("/", getLeagues);
router.post("/", auth, requireRoles(ROLES.ADMIN), createLeague);
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateLeague);
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteLeague);

export default router;
