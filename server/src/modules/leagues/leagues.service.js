import { query } from "../../config/db.js";

export const leaguesService = {
  async getAll() {
    const result = await query("SELECT * FROM leagues WHERE is_active = true ORDER BY id DESC");
    return result.rows;
  },

  async create(payload, userId) {
    const result = await query(
      `INSERT INTO leagues (name, sport_id, season, logo_url, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [payload.name, payload.sportId || null, payload.season || null, payload.logoUrl || null, userId]
    );
    return result.rows[0];
  },

  async update(id, payload) {
    const result = await query(
      `UPDATE leagues
       SET name = COALESCE($2, name),
           sport_id = COALESCE($3, sport_id),
           season = COALESCE($4, season),
           logo_url = COALESCE($5, logo_url),
           is_active = COALESCE($6, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.sportId || null, payload.season || null, payload.logoUrl || null, payload.isActive]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query("DELETE FROM leagues WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
