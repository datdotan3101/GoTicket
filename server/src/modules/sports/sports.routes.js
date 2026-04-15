import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { ROLES } from "../../constants/roles.js";
import { createSport, deleteSport, getSports, updateSport } from "./sports.controller.js";

const router = Router();

router.get("/", getSports);
router.post("/", auth, requireRoles(ROLES.ADMIN), createSport);
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateSport);
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteSport);

export default router;
