import express from "express";
import { messagesController } from "./messages.controller.js";
import { auth } from "../../middlewares/auth.js";

const router = express.Router();

router.use(auth);

router.post("/", messagesController.sendMessage);
router.get("/inbox", messagesController.getInbox);
router.get("/drafts", messagesController.getDrafts);
router.get("/starred", messagesController.getStarred);
router.get("/unread-count", messagesController.getUnreadCount);
router.get("/sent", messagesController.getSent);
router.get("/recipients", messagesController.getRecipients);
router.patch("/mark-all-read", messagesController.markAllAsRead);
router.patch("/:id/read", messagesController.markAsRead);
router.patch("/:id/star", messagesController.toggleStar);

export default router;
