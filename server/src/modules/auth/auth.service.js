import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";

const getPublicUser = (row) => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  role: row.role,
  club_id: row.club_id,
  is_approved: row.is_approved
});

const signAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, club_id: user.club_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const authService = {
  async register(payload) {
    const { email, password, fullName, phone } = payload;
    const existed = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existed.rowCount > 0) {
      throw new Error("Email đã tồn tại.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await withTransaction(async (tx) => {
      const inserted = await tx.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, is_approved)
         VALUES ($1, $2, $3, $4, 'audience', true, true)
         RETURNING id, email, full_name, role, club_id, is_approved`,
        [email, passwordHash, fullName, phone || null]
      );
      const createdUser = inserted.rows[0];
      return createdUser;
    });

    return getPublicUser(user);
  },

  async login(payload) {
    const { email, password } = payload;
    const result = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email]);
    if (result.rowCount === 0) {
      throw new Error("Email hoặc mật khẩu không đúng.");
    }

    const user = result.rows[0];
    const isPasswordMatched = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatched) {
      throw new Error("Email hoặc mật khẩu không đúng.");
    }
    if (!user.is_approved) {
      throw new Error("Tài khoản đang chờ admin phê duyệt.");
    }

    return {
      accessToken: signAccessToken(user),
      user: getPublicUser(user)
    };
  },

  async me(userId) {
    const result = await query(
      "SELECT id, email, full_name, role, club_id, is_approved FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) {
      throw new Error("Không tìm thấy người dùng.");
    }
    return result.rows[0];
  },

  async onboarding(userId, payload) {
    const { primarySportId, secondarySportId } = payload;
    const result = await query(
      `UPDATE users
       SET primary_sport_id = $1, secondary_sport_id = $2
       WHERE id = $3
       RETURNING id, email, full_name, role, primary_sport_id, secondary_sport_id`,
      [primarySportId || null, secondarySportId || null, userId]
    );
    return result.rows[0];
  }
};
