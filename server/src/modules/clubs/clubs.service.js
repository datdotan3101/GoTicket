import { query } from "../../config/db.js";

export const clubsService = {
  /**
   * Lấy danh sách câu lạc bộ (public).
   * Hỗ trợ filter by sport_id.
   */
  async getAll(queryParams = {}) {
    const { sportId } = queryParams;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (sportId) {
      conditions.push(`c.sport_id = $${idx++}`);
      values.push(Number(sportId));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT c.*, s.name AS sport_name, s.slug AS sport_slug
       FROM clubs c
       LEFT JOIN sports s ON s.id = c.sport_id
       ${where}
       ORDER BY c.name ASC`,
      values
    );
    return result.rows;
  },

  /**
   * Lấy chi tiết CLB theo id.
   */
  async getById(id) {
    const result = await query(
      `SELECT c.*, s.name AS sport_name, s.slug AS sport_slug
       FROM clubs c
       LEFT JOIN sports s ON s.id = c.sport_id
       WHERE c.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Tạo CLB mới (admin only).
   */
  async create(payload) {
    const result = await query(
      `INSERT INTO clubs (name, logo_url, sport_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [payload.name, payload.logoUrl || null, payload.sportId || null]
    );
    return result.rows[0];
  },

  /**
   * Cập nhật CLB (admin only).
   */
  async update(id, payload) {
    const result = await query(
      `UPDATE clubs
       SET name     = COALESCE($2, name),
           logo_url = COALESCE($3, logo_url),
           sport_id = COALESCE($4, sport_id)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.logoUrl || null, payload.sportId || null]
    );
    return result.rows[0] || null;
  },

  /**
   * Xoá CLB (admin only).
   */
  async remove(id) {
    const result = await query("DELETE FROM clubs WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
