import { query } from "../../config/db.js";

export const stadiumsService = {
  async getAll() {
    const result = await query("SELECT * FROM stadiums ORDER BY id DESC");
    return result.rows;
  },

  async create(payload) {
    const result = await query(
      `INSERT INTO stadiums (name, city, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [payload.name, payload.city || null, payload.address || null]
    );
    return result.rows[0];
  },

  async update(id, payload) {
    const result = await query(
      `UPDATE stadiums
       SET name = COALESCE($2, name),
           city = COALESCE($3, city),
           address = COALESCE($4, address)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.city || null, payload.address || null]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query("DELETE FROM stadiums WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
