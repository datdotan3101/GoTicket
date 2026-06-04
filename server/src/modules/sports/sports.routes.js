import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { ROLES } from "../../constants/roles.js";
import { create, remove, getAll, update } from "./sports.controller.js";

const router = Router();

router.get("/", getAll);
router.post("/", auth, requireRoles(ROLES.ADMIN), create);
router.put("/:id", auth, requireRoles(ROLES.ADMIN), update);
router.delete("/:id", auth, requireRoles(ROLES.ADMIN), remove);

export default router;
