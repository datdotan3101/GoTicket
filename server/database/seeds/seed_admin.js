import "dotenv/config";
import { db } from "../../src/config/db.js";
import bcrypt from "bcryptjs";

/**
 * Seed: Tạo user admin mặc định.
 * Chạy: node database/seeds/seed_admin.js
 */
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@goticket.vn";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = "GoTicket Admin";

const seedAdmin = async () => {
  console.log("🌱 Seeding admin user...");

  const existing = await db.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
  if (existing.rowCount > 0) {
    console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL} (id=${existing.rows[0].id})`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const result = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active, is_approved)
     VALUES ($1, $2, $3, 'admin', true, true)
     RETURNING id, email, role`,
    [ADMIN_EMAIL, passwordHash, ADMIN_NAME]
  );

  const admin = result.rows[0];
  console.log(`✅ Admin user created: ${admin.email} (id=${admin.id}, role=${admin.role})`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   \n⚠️  Hãy đổi mật khẩu ngay sau khi deploy!`);
};

seedAdmin()
  .then(() => db.end())
  .catch((err) => {
    console.error("❌ Seed failed:", err.message);
    db.end();
    process.exit(1);
  });
