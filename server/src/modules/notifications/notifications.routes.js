import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { getNotifications, markNotificationRead } from "./notifications.controller.js";

const router = Router();

router.get("/", auth, getNotifications);
router.put("/:id/read", auth, markNotificationRead);

export default router;
