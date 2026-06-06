import { messagesService } from "./messages.service.js";
import { query } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

export const messagesController = {
  sendMessage: asyncHandler(async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, subject, body, is_draft } = req.body;

    if (!receiverId || !subject || !body) {
      throw new AppError("Missing required fields", 400);
    }

    const message = await messagesService.sendMessage(senderId, receiverId, subject, body, is_draft);
    return sendSuccess(res, message, 201);
  }),

  getRecipients: asyncHandler(async (req, res) => {
    const targetRole = req.user.role === 'admin' ? 'manager' : 'admin';
    const result = await query(
      `SELECT id, email, full_name, avatar_url, role 
       FROM users 
       WHERE role = $1 AND is_active = true`,
      [targetRole]
    );
    return sendSuccess(res, result.rows);
  }),

  getInbox: asyncHandler(async (req, res) => {
    const messages = await messagesService.getInbox(req.user.id);
    return sendSuccess(res, messages);
  }),

  getUnreadCount: asyncHandler(async (req, res) => {
    const count = await messagesService.getUnreadCount(req.user.id);
    return sendSuccess(res, { count });
  }),

  getSent: asyncHandler(async (req, res) => {
    const messages = await messagesService.getSent(req.user.id);
    return sendSuccess(res, messages);
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await messagesService.markAsRead(id, req.user.id);
    
    if (!message) {
      throw new AppError("Message not found or already read", 404);
    }

    return sendSuccess(res, message);
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    const count = await messagesService.markAllAsRead(req.user.id);
    return sendSuccess(res, { count });
  }),

  toggleStar: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await messagesService.toggleStar(id, req.user.id);
    
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    return sendSuccess(res, message);
  }),

  getDrafts: asyncHandler(async (req, res) => {
    const messages = await messagesService.getDrafts(req.user.id);
    return sendSuccess(res, messages);
  }),

  getStarred: asyncHandler(async (req, res) => {
    const messages = await messagesService.getStarred(req.user.id);
    return sendSuccess(res, messages);
  }),

  deleteMessage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await messagesService.softDeleteMessage(id, req.user.id);
    
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    return sendSuccess(res, message);
  })
};
