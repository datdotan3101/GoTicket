import { Router } from "express";
import { ROLES } from "../../constants/roles.js";
import { auth } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/roles.js";
import { createNews, deleteNews, getNews, getNewsBySlug, submitNews, updateNews } from "./news.controller.js";

const router = Router();

router.get("/", getNews);
router.get("/:slug", getNewsBySlug);
router.post("/", auth, requireRoles(ROLES.EDITOR), createNews);
router.put("/:id", auth, requireRoles(ROLES.EDITOR), updateNews);
router.delete("/:id", auth, requireRoles(ROLES.EDITOR), deleteNews);
router.post("/:id/submit", auth, requireRoles(ROLES.EDITOR), submitNews);

export default router;
