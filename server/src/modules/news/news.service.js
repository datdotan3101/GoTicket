import slugify from "slugify";
import { query, withTransaction } from "../../config/db.js";

const makeSlug = (title) =>
  slugify(title, {
    lower: true,
    strict: true,
    locale: "vi"
  });

const parseStatus = (row) => row;

export const newsService = {
  async getPublished() {
    const result = await query(
      `SELECT n.*, u.full_name AS author_name, s.name AS sport_name
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN sports s ON s.id = n.sport_id
       WHERE n.status = 'published'
       ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC`
    );
    return result.rows.map(parseStatus);
  },

  async getBySlug(slug) {
    const result = await query(
      `SELECT n.*, u.full_name AS author_name, s.name AS sport_name
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN sports s ON s.id = n.sport_id
       WHERE n.slug = $1
       LIMIT 1`,
      [slug]
    );
    return result.rows[0] || null;
  },

  async create(payload, userId) {
    const title = payload.title;
    const slug = makeSlug(title);
    const result = await query(
      `INSERT INTO news (title, slug, content, thumbnail_url, author_id, sport_id, status, scheduled_publish_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
       RETURNING *`,
      [title, slug, payload.content, payload.thumbnailUrl || null, userId, payload.sportId || null, payload.scheduledPublishAt || null]
    );
    return result.rows[0];
  },

  async update(id, payload, userId) {
    const result = await query(
      `UPDATE news
       SET title = COALESCE($2, title),
           slug = COALESCE($3, slug),
           content = COALESCE($4, content),
           thumbnail_url = COALESCE($5, thumbnail_url),
           sport_id = COALESCE($6, sport_id),
           scheduled_publish_at = COALESCE($7, scheduled_publish_at)
       WHERE id = $1 AND author_id = $8
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

  async remove(id, userId) {
    const result = await query("DELETE FROM news WHERE id = $1 AND author_id = $2 RETURNING id", [id, userId]);
    return result.rowCount > 0;
  },

  async submit(id, userId) {
    return withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      const newsResult = await run(
        `UPDATE news
         SET status = 'pending_review'
         WHERE id = $1 AND author_id = $2
         RETURNING id, scheduled_publish_at`,
        [id, userId]
      );
      if (newsResult.rowCount === 0) {
        throw new Error("Không tìm thấy bài viết hoặc bạn không có quyền submit.");
      }
      await run(
        `INSERT INTO approvals (resource_type, resource_id, submitted_by, status)
         VALUES ('news', $1, $2, 'pending')`,
        [id, userId]
      );
      return { id, status: "pending_review" };
    });
  }
};
