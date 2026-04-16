import slugify from "slugify";
import { query, withTransaction } from "../../config/db.js";
import { getPagination, buildPaginatedResponse } from "../../utils/pagination.js";

const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, locale: "vi" });

export const newsService = {
  /**
   * Lấy danh sách bài đã published (public).
   * Hỗ trợ filter by sport_id, search by title, phân trang.
   */
  async getPublished(queryParams = {}) {
    const { page, limit, offset } = getPagination(queryParams);
    const { sportId, search } = queryParams;

    const conditions = ["n.status = 'published'"];
    const values = [];
    let idx = 1;

    if (sportId) {
      conditions.push(`n.sport_id = $${idx++}`);
      values.push(Number(sportId));
    }
    if (search) {
      conditions.push(`n.title ILIKE $${idx++}`);
      values.push(`%${search}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT n.id, n.title, n.slug, n.thumbnail_url, n.status,
                n.published_at, n.created_at,
                u.full_name AS author_name,
                s.name AS sport_name, s.slug AS sport_slug
         FROM news n
         LEFT JOIN users u ON u.id = n.author_id
         LEFT JOIN sports s ON s.id = n.sport_id
         ${where}
         ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(
        `SELECT COUNT(*) FROM news n ${where}`,
        values
      )
    ]);

    return buildPaginatedResponse(dataResult.rows, Number(countResult.rows[0].count), page, limit);
  },

  /**
   * Lấy bài viết theo slug (public — chỉ published).
   */
  async getBySlug(slug) {
    const result = await query(
      `SELECT n.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
              s.name AS sport_name, s.slug AS sport_slug
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN sports s ON s.id = n.sport_id
       WHERE n.slug = $1 AND n.status = 'published'
       LIMIT 1`,
      [slug]
    );
    return result.rows[0] || null;
  },

  /**
   * Lấy bài viết theo id (dành cho editor/admin — không filter status).
   */
  async getById(id) {
    const result = await query(
      `SELECT n.*, u.full_name AS author_name,
              s.name AS sport_name, s.slug AS sport_slug
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN sports s ON s.id = n.sport_id
       WHERE n.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Lấy danh sách bài của editor hiện tại (mọi status).
   */
  async getMyNews(userId, queryParams = {}) {
    const { page, limit, offset } = getPagination(queryParams);
    const { status } = queryParams;

    const conditions = ["n.author_id = $1"];
    const values = [userId];
    let idx = 2;

    if (status) {
      conditions.push(`n.status = $${idx++}`);
      values.push(status);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT n.id, n.title, n.slug, n.status, n.thumbnail_url,
                n.scheduled_publish_at, n.published_at, n.created_at,
                s.name AS sport_name
         FROM news n
         LEFT JOIN sports s ON s.id = n.sport_id
         ${where}
         ORDER BY n.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM news n ${where}`, values)
    ]);

    return buildPaginatedResponse(dataResult.rows, Number(countResult.rows[0].count), page, limit);
  },

  /**
   * Tạo bài viết mới (status = draft).
   */
  async create(payload, userId) {
    const slug = makeSlug(payload.title);
    const result = await query(
      `INSERT INTO news (title, slug, content, thumbnail_url, author_id, sport_id, status, scheduled_publish_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
       RETURNING *`,
      [
        payload.title,
        slug,
        payload.content,
        payload.thumbnailUrl || null,
        userId,
        payload.sportId || null,
        payload.scheduledPublishAt || null
      ]
    );
    return result.rows[0];
  },

  /**
   * Cập nhật bài viết (chỉ author, chỉ khi draft hoặc rejected).
   */
  async update(id, payload, userId) {
    const result = await query(
      `UPDATE news
       SET title                = COALESCE($2, title),
           slug                 = COALESCE($3, slug),
           content              = COALESCE($4, content),
           thumbnail_url        = COALESCE($5, thumbnail_url),
           sport_id             = COALESCE($6, sport_id),
           scheduled_publish_at = COALESCE($7, scheduled_publish_at)
       WHERE id = $1
         AND author_id = $8
         AND status IN ('draft', 'rejected')
       RETURNING *`,
      [
        id,
        payload.title || null,
        payload.title ? makeSlug(payload.title) : null,
        payload.content || null,
        payload.thumbnailUrl || null,
        payload.sportId || null,
        payload.scheduledPublishAt || null,
        userId
      ]
    );
    return result.rows[0] || null;
  },

  /**
   * Xoá bài viết (chỉ author, chỉ khi draft hoặc rejected).
   */
  async remove(id, userId) {
    const result = await query(
      "DELETE FROM news WHERE id = $1 AND author_id = $2 AND status IN ('draft', 'rejected') RETURNING id",
      [id, userId]
    );
    return result.rowCount > 0;
  },

  /**
   * Editor submit bài để admin duyệt.
   * Chuyển status → pending_review, tạo approval record.
   */
  async submit(id, userId) {
    return withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);

      // Kiểm tra bài tồn tại và thuộc author, đang ở draft/rejected
      const newsResult = await run(
        `UPDATE news
         SET status = 'pending_review'
         WHERE id = $1 AND author_id = $2 AND status IN ('draft', 'rejected')
         RETURNING id, scheduled_publish_at`,
        [id, userId]
      );
      if (newsResult.rowCount === 0) {
        throw new Error("Không tìm thấy bài viết hoặc bài viết không thể submit.");
      }

      // Xoá approval pending cũ nếu có (trường hợp submit lại sau khi bị reject)
      await run(
        "DELETE FROM approvals WHERE resource_type = 'news' AND resource_id = $1 AND status = 'pending'",
        [id]
      );

      await run(
        `INSERT INTO approvals (resource_type, resource_id, submitted_by, status, scheduled_publish_at)
         VALUES ('news', $1, $2, 'pending', $3)`,
        [id, userId, newsResult.rows[0].scheduled_publish_at]
      );

      return { id, status: "pending_review" };
    });
  }
};
