import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";
import { redis } from "../../config/redis.js";
import { sendAccountDeletionEmail } from "../../utils/email.service.js";
import { logger } from "../../utils/logger.js";

const getPublicUser = (row) => ({
  id: row.id,
  email: row.email,
  full_name: row.full_name,
  role: row.role,
  club_id: row.club_id,
  is_approved: row.is_approved,
  hasPassword: !!row.password_hash,
  avatar_url: row.avatar_url
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
    const existed = await query("SELECT id, password_hash FROM users WHERE email = $1", [email]);
    
    const passwordHash = await bcrypt.hash(password, 10);
    let user;

    if (existed.rowCount > 0) {
      if (existed.rows[0].password_hash) {
        throw new Error("Email already exists.");
      } else {
        // Placeholder account (created via gift ticket or Google login) — update password and profile info
        user = await withTransaction(async (tx) => {
          const updated = await tx.query(
            `UPDATE users 
             SET password_hash = $1, full_name = $2, phone = $3
             WHERE id = $4
             RETURNING id, email, full_name, role, club_id, is_approved, password_hash`,
            [passwordHash, fullName, phone || null, existed.rows[0].id]
          );
          return updated.rows[0];
        });
      }
    } else {
      user = await withTransaction(async (tx) => {
        const inserted = await tx.query(
          `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, is_approved)
           VALUES ($1, $2, $3, $4, 'audience', true, true)
           RETURNING id, email, full_name, role, club_id, is_approved, password_hash`,
          [email, passwordHash, fullName, phone || null]
        );
        return inserted.rows[0];
      });
    }

    return getPublicUser(user);
  },

  async login(payload) {
    const { email, password } = payload;
    const result = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email]);
    if (result.rowCount === 0) {
      throw new Error("Incorrect email or password.");
    }

    const user = result.rows[0];
    const isPasswordMatched = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatched) {
      throw new Error("Incorrect email or password.");
    }
    if (!user.is_approved) {
      throw new Error("Account is pending admin approval.");
    }

    return {
      accessToken: signAccessToken(user),
      user: getPublicUser(user)
    };
  },

  async googleLogin(payload) {
    const { idToken } = payload;
    if (!idToken) {
      throw new Error("Google ID token is required.");
    }

    try {
      // 1. Verify ID Token via Google API
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        throw new Error("Google ID token is invalid or expired.");
      }

      const googlePayload = await response.json();
      
      // 2. Verify Client ID (Audience) if GOOGLE_CLIENT_ID is configured
      const clientID = process.env.GOOGLE_CLIENT_ID;
      if (clientID && googlePayload.aud !== clientID) {
        throw new Error("Google ID token does not match the application's Client ID.");
      }

      const googleId = googlePayload.sub;
      const email = googlePayload.email;
      const fullName = googlePayload.name || "Google User";

      // 3. Find user by google_id
      let result = await query("SELECT * FROM users WHERE google_id = $1 AND is_active = true", [googleId]);
      
      let user;
      if (result.rowCount > 0) {
        user = result.rows[0];
      } else {
        // 4. If no google_id match, try finding by email
        const emailResult = await query("SELECT * FROM users WHERE email = $1 AND is_active = true", [email]);
        if (emailResult.rowCount > 0) {
          user = emailResult.rows[0];
          // Link the google_id to the existing account
          const updateResult = await query(
            "UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [googleId, user.id]
          );
          user = updateResult.rows[0];
        } else {
          // 5. If not found, auto-register a new account
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
        throw new Error("Account is pending admin approval.");
      }

      return {
        accessToken: signAccessToken(user),
        user: getPublicUser(user)
      };
    } catch (error) {
      throw new Error(error.message || "Google authentication failed.", { cause: error });
    }
  },

  async me(userId) {
    const result = await query(
      "SELECT id, email, full_name, role, club_id, is_approved, password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) {
      throw new Error("User not found.");
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
   * Update personal profile (full_name, email).
   */
  async updateProfile(userId, payload) {
    const { fullName, email, avatarUrl } = payload;

    // Check if email is already used by another user
    if (email) {
      const existed = await query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (existed.rowCount > 0) {
        throw new Error("This email is already in use by another account.");
      }
    }

    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, full_name, role, club_id, is_approved, password_hash, avatar_url`,
      [fullName || null, email || null, avatarUrl || null, userId]
    );
    if (result.rowCount === 0) throw new Error("User not found.");
    return getPublicUser(result.rows[0]);
  },

  /**
   * Change password — requires the current password to be correct.
   */
  async changePassword(userId, payload) {
    const { currentPassword, newPassword } = payload;

    const result = await query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) throw new Error("User not found.");

    const user = result.rows[0];
    
    // If account already has a password, the current password must be provided and correct
    if (user.password_hash) {
      if (!currentPassword) {
        throw new Error("Please enter your current password to proceed.");
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        throw new Error("Current password is incorrect.");
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
   * Delete user account (self-initiated).
   * Fetches user info first so we can send a confirmation email after deletion.
   * Attempts a hard delete; falls back to soft delete (deactivate) if foreign key constraints prevent it.
   */
  async deleteAccount(userId) {
    // Fetch user info before deletion so we can send the confirmation email
    const userResult = await query(
      "SELECT id, email, full_name FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    try {
      await query("DELETE FROM users WHERE id = $1", [userId]);
    } catch {
      // Fallback: Soft delete by setting is_active = false and obfuscating email and google_id
      // to allow the user to potentially register again with the same email/google account if they wanted.
      await query(
        "UPDATE users SET is_active = false, email = email || '_deleted_' || id, google_id = CASE WHEN google_id IS NOT NULL THEN google_id || '_deleted_' || id ELSE NULL END, updated_at = NOW() WHERE id = $1",
        [userId]
      );
    }

    // Send deletion confirmation email (fire-and-forget — do not block the response)
    if (user) {
      sendAccountDeletionEmail(user).catch((err) =>
        logger.error(`[Email] Failed to send account deletion email to ${user.email}: ${err.message}`)
      );
    }

    return { success: true };
  },

  async logout(token, decoded) {
    if (!redis) return { success: true };
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;
    if (ttl > 0) {
      await redis.set(`blacklist:${token}`, "true", { ex: ttl });
    }
    return { success: true };
  },

  /**
   * Request an OTP to reset password
   */
  async forgotPassword(payload) {
    const { email } = payload;
    const result = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      throw new Error("User with this email not found.");
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTPs for this email to prevent spam
    await query("DELETE FROM password_resets WHERE email = $1", [email]);

    // Use NOW() + INTERVAL directly in PostgreSQL to avoid JS timezone mismatch
    await query(
      "INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')",
      [email, otp]
    );

    // Send the OTP email
    const { sendOTPEmail } = await import("../../utils/email.service.js");
    sendOTPEmail(email, otp).catch((err) =>
      logger.error(`[Email] Failed to send OTP email to ${email}: ${err.message}`)
    );

    return { success: true, message: "OTP sent to email." };
  },

  /**
   * Verify the received OTP
   */
  async verifyOTP(payload) {
    const { email, otp } = payload;
    const result = await query(
      "SELECT id FROM password_resets WHERE email = $1 AND otp = $2 AND expires_at > NOW()",
      [email, otp]
    );

    if (result.rowCount === 0) {
      throw new Error("Invalid or expired OTP.");
    }

    await query("UPDATE password_resets SET verified = true WHERE id = $1", [result.rows[0].id]);

    return { success: true, message: "OTP verified successfully." };
  },

  /**
   * Reset the password
   */
  async resetPassword(payload) {
    const { email, otp, newPassword } = payload;
    
    // Check if there is a verified OTP matching the email and otp
    const result = await query(
      "SELECT id FROM password_resets WHERE email = $1 AND otp = $2 AND verified = true AND expires_at > NOW()",
      [email, otp]
    );

    if (result.rowCount === 0) {
      throw new Error("Invalid, expired, or unverified OTP.");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2",
      [newHash, email]
    );

    // Clean up the OTP
    await query("DELETE FROM password_resets WHERE email = $1", [email]);

    return { success: true, message: "Password reset successfully." };
  }
};
