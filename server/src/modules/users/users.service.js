import { query } from "../../config/db.js";

export const usersService = {
  async getAll() {
    const result = await query(
      `SELECT id, email, full_name, phone, role, club_id, is_active, is_approved, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async updateRole(id, role, clubId) {
    const result = await query(
      `UPDATE users
       SET role = $2, club_id = $3
       WHERE id = $1
       RETURNING id, email, full_name, role, club_id, is_active, is_approved`,
      [id, role, clubId || null]
    );
    return result.rows[0] || null;
  },

  async setActive(id, isActive) {
    const result = await query(
      `UPDATE users
       SET is_active = $2
       WHERE id = $1
       RETURNING id, email, full_name, role, is_active`,
      [id, isActive]
    );
    return result.rows[0] || null;
  }
};
