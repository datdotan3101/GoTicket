import { query } from "../../config/db.js";

export const stadiumsService = {
  /**
   * Lấy danh sách sân vận động (public).
   * Hỗ trợ search by name/city.
   */
  async getAll(queryParams = {}) {
    const { search } = queryParams;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(s.name ILIKE $${idx} OR s.city ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT * FROM stadiums s ${where} ORDER BY s.name ASC`,
      values
    );
    return result.rows;
  },

  /**
   * Lấy chi tiết sân theo id.
   */
  async getById(id) {
    const result = await query(
      "SELECT * FROM stadiums WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Tạo sân vận động mới (admin only).
   */
  async create(payload) {
    const result = await query(
      `INSERT INTO stadiums (name, city, address, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.name, payload.city || null, payload.address || null, payload.imageUrl || null]
    );
    return result.rows[0];
  },

  /**
   * Cập nhật sân (admin only).
   */
  async update(id, payload) {
    const result = await query(
      `UPDATE stadiums
       SET name      = COALESCE($2, name),
           city      = COALESCE($3, city),
           address   = COALESCE($4, address),
           image_url = COALESCE($5, image_url)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.city || null, payload.address || null, payload.imageUrl || null]
    );
    return result.rows[0] || null;
  },

  /**
   * Xoá sân (admin only).
   */
  async remove(id) {
    const result = await query("DELETE FROM stadiums WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
