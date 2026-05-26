import { query } from "../../config/db.js";
import { getPagination, buildPaginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../utils/AppError.js";

export const leaguesService = {
  /**
   * Get list of leagues (public).
   * Supports filtering by sport_id, is_active, and pagination.
   */
  async getAll(queryParams = {}) {
    const { page, limit, offset } = getPagination(queryParams);
    const { sportId, isActive } = queryParams;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (sportId) {
      conditions.push(`l.sport_id = $${idx++}`);
      values.push(Number(sportId));
    }
    if (isActive !== undefined) {
      conditions.push(`l.is_active = $${idx++}`);
      values.push(isActive !== "false");
    } else {
      // Default to only fetching active ones
      conditions.push("l.is_active = true");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT l.*, s.name AS sport_name, s.slug AS sport_slug,
                u.full_name AS created_by_name
         FROM leagues l
         LEFT JOIN sports s ON s.id = l.sport_id
         LEFT JOIN users u ON u.id = l.created_by
         ${where}
         ORDER BY l.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM leagues l ${where}`, values)
    ]);

    return buildPaginatedResponse(dataResult.rows, Number(countResult.rows[0].count), page, limit);
  },

  /**
   * Get league detail by id.
   */
  async getById(id) {
    const result = await query(
      `SELECT l.*, s.name AS sport_name, s.slug AS sport_slug,
              u.full_name AS created_by_name
       FROM leagues l
       LEFT JOIN sports s ON s.id = l.sport_id
       LEFT JOIN users u ON u.id = l.created_by
       WHERE l.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Create a new league (admin only).
   */
  async create(payload, userId) {
    const result = await query(
      `INSERT INTO leagues (name, sport_id, season, logo_url, start_date, end_date, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        payload.name,
        payload.sportId || null,
        payload.season || null,
        payload.logoUrl || null,
        payload.startDate || null,
        payload.endDate || null,
        userId,
      ]
    );
    return result.rows[0];
  },

  /**
   * Update a league (admin only).
   */
  async update(id, payload) {
    const result = await query(
      `UPDATE leagues
       SET name       = COALESCE($2, name),
           sport_id   = COALESCE($3, sport_id),
           season     = COALESCE($4, season),
           logo_url   = COALESCE($5, logo_url),
           is_active  = COALESCE($6, is_active),
           start_date = COALESCE($7, start_date),
           end_date   = COALESCE($8, end_date)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        payload.name || null,
        payload.sportId || null,
        payload.season || null,
        payload.logoUrl || null,
        payload.isActive ?? null,
        payload.startDate || null,
        payload.endDate || null,
      ]
    );
    return result.rows[0] || null;
  },

  /**
   * Delete a league (admin only).
   */
  async remove(id) {
    // Check for associated matches
    const matchesCount = await query("SELECT COUNT(*) FROM matches WHERE league_id = $1", [id]);
    if (parseInt(matchesCount.rows[0].count) > 0) {
      throw new AppError("Cannot delete league because there are matches referencing it.", 400);
    }
    const result = await query("DELETE FROM leagues WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
