import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createClub, deleteClub, getClubs, updateClub } from "./clubs.controller.js";

const router = Router();

router.get("/", getClubs);
router.post("/", auth, requireRoles(ROLES.ADMIN), createClub);
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateClub);
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteClub);

export default router;
