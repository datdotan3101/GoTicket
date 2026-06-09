import { query } from "../../config/db.js";

export const clubsService = {
  /**
   * Get list of clubs (public).
   * Supports filtering by sport_id.
   */
  async getAll(queryParams = {}) {
    const { sportId, leagueId } = queryParams;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (sportId) {
      conditions.push(`c.sport_id = $${idx++}`);
      values.push(Number(sportId));
    }
    
    if (leagueId) {
      conditions.push(`c.league_id = $${idx}`);
      values.push(Number(leagueId));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT c.*, s.name AS sport_name, s.slug AS sport_slug, l.name AS league_name
       FROM clubs c
       LEFT JOIN sports s ON s.id = c.sport_id
       LEFT JOIN leagues l ON l.id = c.league_id
       ${where}
       ORDER BY c.name ASC`,
      values
    );
    return result.rows;
  },

  /**
   * Get club detail by id.
   */
  async getById(id) {
    const result = await query(
      `SELECT c.*, s.name AS sport_name, s.slug AS sport_slug, l.name AS league_name
       FROM clubs c
       LEFT JOIN sports s ON s.id = c.sport_id
       LEFT JOIN leagues l ON l.id = c.league_id
       WHERE c.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new club (admin only).
   */
  async create(payload) {
    const result = await query(
      `INSERT INTO clubs (name, logo_url, sport_id, league_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.name, payload.logoUrl || null, payload.sportId || null, payload.leagueId || null]
    );
    return result.rows[0];
  },

  /**
   * Update a club (admin only).
   */
  async update(id, payload) {
    const result = await query(
      `UPDATE clubs
       SET name     = COALESCE($2, name),
           logo_url = COALESCE($3, logo_url),
           sport_id = COALESCE($4, sport_id),
           league_id = COALESCE($5, league_id)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.logoUrl || null, payload.sportId || null, payload.leagueId || null]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a club (admin only).
   */
  async remove(id) {
    const result = await query("DELETE FROM clubs WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
