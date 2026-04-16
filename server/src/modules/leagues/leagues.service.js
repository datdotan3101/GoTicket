import { query } from "../../config/db.js";
import { getPagination, buildPaginatedResponse } from "../../utils/pagination.js";

export const leaguesService = {
  /**
   * Lấy danh sách giải đấu (public).
   * Hỗ trợ filter by sport_id, is_active, phân trang.
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
      // Mặc định chỉ lấy active
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
   * Lấy chi tiết giải đấu theo id.
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
   * Tạo giải đấu mới (admin only).
   */
  async create(payload, userId) {
    const result = await query(
      `INSERT INTO leagues (name, sport_id, season, logo_url, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [payload.name, payload.sportId || null, payload.season || null, payload.logoUrl || null, userId]
    );
    return result.rows[0];
  },

  /**
   * Cập nhật giải đấu (admin only).
   */
  async update(id, payload) {
    const result = await query(
      `UPDATE leagues
       SET name      = COALESCE($2, name),
           sport_id  = COALESCE($3, sport_id),
           season    = COALESCE($4, season),
           logo_url  = COALESCE($5, logo_url),
           is_active = COALESCE($6, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, payload.name || null, payload.sportId || null, payload.season || null, payload.logoUrl || null, payload.isActive ?? null]
    );
    return result.rows[0] || null;
  },

  /**
   * Xoá giải đấu (admin only).
   */
  async remove(id) {
    const result = await query("DELETE FROM leagues WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
