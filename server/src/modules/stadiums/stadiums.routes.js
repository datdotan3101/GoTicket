import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createStadium, deleteStadium, getStadiums, updateStadium } from "./stadiums.controller.js";

const router = Router();

router.get("/", getStadiums);
router.post("/", auth, requireRoles(ROLES.ADMIN), createStadium);
router.put("/:id", auth, requireRoles(ROLES.ADMIN), updateStadium);
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), deleteStadium);

export default router;
