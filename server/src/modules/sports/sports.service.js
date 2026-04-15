import slugify from "slugify";
import { query } from "../../config/db.js";

const toSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    locale: "vi"
  });

export const sportsService = {
  async getAll() {
    const result = await query("SELECT * FROM sports WHERE is_active = true ORDER BY id DESC");
    return result.rows;
  },

  async create(payload) {
    const { name, bannerUrl } = payload;
    const slug = toSlug(name);
    const result = await query(
      `INSERT INTO sports (name, slug, banner_url, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [name, slug, bannerUrl || null]
    );
    return result.rows[0];
  },

  async update(id, payload) {
    const { name, bannerUrl, isActive } = payload;
    const result = await query(
      `UPDATE sports
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           banner_url = COALESCE($4, banner_url),
           is_active = COALESCE($5, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, name || null, name ? toSlug(name) : null, bannerUrl || null, isActive]
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await query("DELETE FROM sports WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  }
};
