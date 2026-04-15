import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import {
  configureStands,
  createMatch,
  getMatchById,
  getMatchSeats,
  getMatches,
  previewStands,
  submitMatch
} from "./matches.controller.js";

const router = Router();

router.get("/", getMatches);
router.get("/:id", getMatchById);
router.get("/:id/seats", getMatchSeats);
router.post("/", auth, requireRoles(ROLES.MANAGER), createMatch);
router.post("/:id/submit", auth, requireRoles(ROLES.MANAGER), submitMatch);
router.post("/stands/preview", auth, requireRoles(ROLES.MANAGER), previewStands);
router.put("/:id/stands", auth, requireRoles(ROLES.MANAGER), configureStands);

export default router;
