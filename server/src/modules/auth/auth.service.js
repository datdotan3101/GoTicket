import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";

const getPublicUser = (row) => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  role: row.role,
  club_id: row.club_id,
  is_approved: row.is_approved,
  hasPassword: !!row.password_hash
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
         RETURNING id, email, full_name, role, club_id, is_approved, password_hash`,
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

  async googleLogin(payload) {
    const { idToken } = payload;
    if (!idToken) {
      throw new Error("Mã xác thực Google (idToken) là bắt buộc.");
    }

    try {
      // 1. Xác thực ID Token qua API Google
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        throw new Error("Mã xác thực Google không hợp lệ hoặc đã hết hạn.");
      }

      const googlePayload = await response.json();
      
      // 2. Xác minh Client ID (Audience) nếu cấu hình GOOGLE_CLIENT_ID
      const clientID = process.env.GOOGLE_CLIENT_ID;
      if (clientID && googlePayload.aud !== clientID) {
        throw new Error("Mã xác thực Google không khớp với Client ID của ứng dụng.");
      }

      const googleId = googlePayload.sub;
      const email = googlePayload.email;
      const fullName = googlePayload.name || "Google User";

      // 3. Tìm user theo google_id
      let result = await query("SELECT * FROM users WHERE google_id = $1 AND is_active = true", [googleId]);
      
      let user;
      if (result.rowCount > 0) {
        user = result.rows[0];
      } else {
        // 4. Nếu chưa có google_id, tìm theo email
        const emailResult = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email]);
        if (emailResult.rowCount > 0) {
          user = emailResult.rows[0];
          // Cập nhật google_id cho user (liên kết tài khoản)
          const updateResult = await query(
            "UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [googleId, user.id]
          );
          user = updateResult.rows[0];
        } else {
          // 5. Nếu không tìm thấy, đăng ký tài khoản mới tự động
          const insertResult = await query(
            `INSERT INTO users (email, google_id, full_name, role, is_active, is_approved)
             VALUES ($1, $2, $3, 'audience', true, true)
             RETURNING *`,
            [email, googleId, fullName]
          );
          user = insertResult.rows[0];
        }
      }

      if (!user.is_approved) {
        throw new Error("Tài khoản đang chờ admin phê duyệt.");
      }

      return {
        accessToken: signAccessToken(user),
        user: getPublicUser(user)
      };
    } catch (error) {
      throw new Error(error.message || "Xác thực bằng Google thất bại.");
    }
  },

  async me(userId) {
    const result = await query(
      "SELECT id, email, full_name, role, club_id, is_approved, password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) {
      throw new Error("Không tìm thấy người dùng.");
    }
    return getPublicUser(result.rows[0]);
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
  },

  /**
   * Cập nhật thông tin cá nhân (full_name, email).
   */
  async updateProfile(userId, payload) {
    const { fullName, email } = payload;

    // Kiểm tra email có bị dùng bởi user khác không
    if (email) {
      const existed = await query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (existed.rowCount > 0) {
        throw new Error("Email này đã được sử dụng bởi tài khoản khác.");
      }
    }

    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, role, club_id, is_approved, password_hash`,
      [fullName || null, email || null, userId]
    );
    if (result.rowCount === 0) throw new Error("Không tìm thấy người dùng.");
    return getPublicUser(result.rows[0]);
  },

  /**
   * Đổi mật khẩu — phải nhập đúng mật khẩu cũ.
   */
  async changePassword(userId, payload) {
    const { currentPassword, newPassword } = payload;

    const result = await query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) throw new Error("Không tìm thấy người dùng.");

    const user = result.rows[0];
    
    // Nếu tài khoản đã có mật khẩu, bắt buộc phải nhập đúng mật khẩu hiện tại
    if (user.password_hash) {
      if (!currentPassword) {
        throw new Error("Vui lòng nhập mật khẩu hiện tại để thay đổi.");
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        throw new Error("Mật khẩu hiện tại không đúng.");
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newHash, userId]
    );
    return { success: true };
  },

  /**
   * Xoá tài khoản (của chính user).
   * Cố gắng xoá cứng, nếu vướng khoá ngoại thì xoá mềm (deactivate).
   */
  async deleteAccount(userId) {
    try {
      await query("DELETE FROM users WHERE id = $1", [userId]);
      return { success: true };
    } catch (error) {
      // Fallback: Soft delete by setting is_active = false and obfuscating email
      // to allow the user to potentially register again with the same email if they wanted,
      // though typically we just deactivate.
      await query(
        "UPDATE users SET is_active = false, email = email || '_deleted_' || id, updated_at = NOW() WHERE id = $1",
        [userId]
      );
      return { success: true };
    }
  }
};
