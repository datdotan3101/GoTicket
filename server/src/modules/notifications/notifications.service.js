import { query } from "../../config/db.js";
import { emitToUser } from "../../config/socket.js";

export const notificationsService = {
  async createNotification({ userId, type, title, body, relatedId, relatedType }, runner = query) {
    const result = await runner(
      `INSERT INTO notifications (user_id, type, title, body, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, body || null, relatedId || null, relatedType || null]
    );
    const notification = result.rows[0];
    emitToUser(userId, "notification:new", notification);
    return notification;
  },

  async getMyNotifications(userId) {
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  },

  async markAsRead(id, userId) {
    const result = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  }
};
