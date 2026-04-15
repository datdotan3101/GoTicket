import { query } from "../../config/db.js";

export const clubsService = {
  async getAll() {
    const result = await query("SELECT * FROM clubs ORDER BY id DESC");
    return result.rows;
  },

  async create(payload) {
    const result = await query(
      `INSERT INTO clubs (name, logo_url, sport_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [payload.name, payload.logoUrl || null, payload.sportId || null]
    );
    return result.rows[0];
  },

  async update(id, payload) {
    const result = await query(
      `UPDATE clubs
       SET name = COALESCE($2, name),
           logo_url = COALESCE($3, logo_url),
           sport_id = COALESCE($4, sport_id)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.logoUrl || null, payload.sportId || null]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query("DELETE FROM clubs WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
