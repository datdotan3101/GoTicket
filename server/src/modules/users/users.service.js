import { query } from "../../config/db.js";
import { getPagination, buildPaginatedResponse } from "../../utils/pagination.js";
import { ROLES } from "../../constants/roles.js";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = Object.values(ROLES);

export const usersService = {
  /**
   * Get list of users (admin only).
   * Supports filtering by role, is_active, is_approved, and searching by email/name.
   */
  async getAll(queryParams = {}) {
    const { page, limit, offset } = getPagination(queryParams);
    const { role, isActive, isApproved, search } = queryParams;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (role) {
      conditions.push(`u.role = $${idx++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      conditions.push(`u.is_active = $${idx++}`);
      values.push(isActive !== "false");
    }
    if (isApproved !== undefined) {
      conditions.push(`u.is_approved = $${idx++}`);
      values.push(isApproved !== "false");
    }
    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT u.id, u.email, u.full_name, u.phone, u.role,
                u.club_id, u.avatar_url, u.is_active, u.is_approved,
                u.created_at, u.updated_at,
                c.name AS club_name
         FROM users u
         LEFT JOIN clubs c ON c.id = u.club_id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM users u ${where}`, values)
    ]);

    return buildPaginatedResponse(dataResult.rows, Number(countResult.rows[0].count), page, limit);
  },

  /**
   * Get user detail by id (admin only).
   */
  async getById(id) {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role,
              u.club_id, u.avatar_url, u.is_active, u.is_approved,
              u.primary_sport_id, u.secondary_sport_id,
              u.created_at, u.updated_at,
              c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Update user role and club_id (admin only).
   * Validation: role must be in ALLOWED_ROLES.
   */
  async updateRole(id, role, clubId) {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role. Allowed values: ${ALLOWED_ROLES.join(", ")}`);
    }

    // Manager role requires a club_id
    if (role === ROLES.MANAGER && !clubId) {
      throw new Error("Manager must be assigned to a club.");
    }

    // Non-manager roles should have no club_id
    const effectiveClubId = role === ROLES.MANAGER ? (clubId || null) : null;

    const result = await query(
      `UPDATE users
       SET role = $2, club_id = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, club_id, is_active, is_approved`,
      [id, role, effectiveClubId]
    );
    return result.rows[0] || null;
  },

  /**
   * Lock / unlock user account (admin only).
   */
  async setActive(id, isActive) {
    const result = await query(
      `UPDATE users
       SET is_active = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, is_active`,
      [id, isActive]
    );
    return result.rows[0] || null;
  },

  /**
   * Get list of users pending account approval.
   */
  async getPendingApproval() {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role,
              u.is_active, u.is_approved, u.created_at,
              a.id AS approval_id, a.created_at AS submitted_at
       FROM users u
       INNER JOIN approvals a ON a.resource_type = 'user_account' AND a.resource_id = u.id
       WHERE u.is_approved = false AND a.status = 'pending'
       ORDER BY a.created_at ASC`
    );
    return result.rows;
  },

  /**
   * Create an account directly (Admin only).
   */
  async createDirect({ email, password, fullName, role, clubId }) {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role. Allowed values: ${ALLOWED_ROLES.join(", ")}`);
    }

    if (role === ROLES.MANAGER && !clubId) {
      throw new Error("Manager must be assigned to a club.");
    }

    // Check email exists
    const exist = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (exist.rows.length > 0) {
      const err = new Error("Email already exists.");
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const effectiveClubId = role === ROLES.MANAGER ? (clubId || null) : null;

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, club_id, is_active, is_approved)
       VALUES ($1, $2, $3, $4, $5, true, true)
       RETURNING id, email, full_name, role, club_id, is_active, is_approved`,
      [email, hashedPassword, fullName, role, effectiveClubId]
    );
    return result.rows[0];
  }
};
