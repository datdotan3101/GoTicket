import { messagesService } from "./messages.service.js";
import { query } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

export const messagesController = {
  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { receiverId, subject, body, is_draft } = req.body;

      if (!receiverId || !subject || !body) {
        throw new AppError("Missing required fields", 400);
      }

      const message = await messagesService.sendMessage(senderId, receiverId, subject, body, is_draft);
      res.status(201).json({ status: "success", data: message });
    } catch (err) {
      next(err);
    }
  },

  async getRecipients(req, res, next) {
    try {
      const targetRole = req.user.role === 'admin' ? 'manager' : 'admin';
      const result = await query(
        `SELECT id, email, full_name, avatar_url, role 
         FROM users 
         WHERE role = $1 AND is_active = true`,
        [targetRole]
      );
      res.status(200).json({ status: "success", data: result.rows });
    } catch (err) {
      next(err);
    }
  },

  async getInbox(req, res, next) {
    try {
      const messages = await messagesService.getInbox(req.user.id);
      res.status(200).json({ status: "success", data: messages });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await messagesService.getUnreadCount(req.user.id);
      res.status(200).json({ status: "success", data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async getSent(req, res, next) {
    try {
      const messages = await messagesService.getSent(req.user.id);
      res.status(200).json({ status: "success", data: messages });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const message = await messagesService.markAsRead(id, req.user.id);
      
      if (!message) {
        throw new AppError("Message not found or already read", 404);
      }

      res.status(200).json({ status: "success", data: message });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const count = await messagesService.markAllAsRead(req.user.id);
      res.status(200).json({ status: "success", data: { count } });
    } catch (err) {
      next(err);
    }
  },

  async toggleStar(req, res, next) {
    try {
      const { id } = req.params;
      const message = await messagesService.toggleStar(id, req.user.id);
      
      if (!message) {
        throw new AppError("Message not found", 404);
      }

      res.status(200).json({ status: "success", data: message });
    } catch (err) {
      next(err);
    }
  },

  async getDrafts(req, res, next) {
    try {
      const messages = await messagesService.getDrafts(req.user.id);
      res.status(200).json({ status: "success", data: messages });
    } catch (err) {
      next(err);
    }
  },

  async getStarred(req, res, next) {
    try {
      const messages = await messagesService.getStarred(req.user.id);
      res.status(200).json({ status: "success", data: messages });
    } catch (err) {
      next(err);
    }
  }
};
