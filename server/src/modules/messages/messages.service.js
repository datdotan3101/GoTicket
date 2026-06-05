import { query } from "../../config/db.js";

export const messagesService = {
  async sendMessage(senderId, receiverId, subject, body, isDraft = false) {
    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, subject, body, is_draft)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [senderId, receiverId, subject, body, isDraft]
    );
    return result.rows[0];
  },

  async getInbox(userId) {
    const result = await query(
      `SELECT m.*, u.full_name as sender_name, u.email as sender_email, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = $1 AND m.is_draft = false AND m.deleted_by_receiver = false
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM messages
       WHERE receiver_id = $1 AND is_read = false AND is_draft = false AND deleted_by_receiver = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async getSent(userId) {
    const result = await query(
      `SELECT m.*, u.full_name as receiver_name, u.email as receiver_email, u.avatar_url as receiver_avatar
       FROM messages m
       JOIN users u ON m.receiver_id = u.id
       WHERE m.sender_id = $1 AND m.is_draft = false AND m.deleted_by_sender = false
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async markAsRead(id, userId) {
    const result = await query(
      `UPDATE messages
       SET is_read = true
       WHERE id = $1 AND receiver_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async markAllAsRead(userId) {
    const result = await query(
      `UPDATE messages
       SET is_read = true
       WHERE receiver_id = $1 AND is_read = false AND is_draft = false
       RETURNING *`,
      [userId]
    );
    return result.rowCount;
  },

  async toggleStar(id, userId) {
    const result = await query(
      `UPDATE messages
       SET is_starred = NOT is_starred
       WHERE id = $1 AND (receiver_id = $2 OR sender_id = $2)
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  async getDrafts(userId) {
    const result = await query(
      `SELECT m.*, u.full_name as receiver_name, u.email as receiver_email, u.avatar_url as receiver_avatar
       FROM messages m
       JOIN users u ON m.receiver_id = u.id
       WHERE m.sender_id = $1 AND m.is_draft = true AND m.deleted_by_sender = false
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getStarred(userId) {
    const result = await query(
      `SELECT m.*, 
       s.full_name as sender_name, s.email as sender_email, 
       r.full_name as receiver_name, r.email as receiver_email
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE ((m.receiver_id = $1 AND m.deleted_by_receiver = false) OR (m.sender_id = $1 AND m.deleted_by_sender = false)) 
       AND m.is_starred = true AND m.is_draft = false
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async softDeleteMessage(id, userId) {
    const result = await query(
      `UPDATE messages 
       SET deleted_by_sender = CASE WHEN sender_id = $2 THEN true ELSE deleted_by_sender END,
           deleted_by_receiver = CASE WHEN receiver_id = $2 THEN true ELSE deleted_by_receiver END
       WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  }
};
