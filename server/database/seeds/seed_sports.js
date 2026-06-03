import "dotenv/config";
import { db } from "../../src/config/db.js";

/**
 * Seed: Tạo 5 môn thể thao mặc định.
 * Chạy: node database/seeds/seed_sports.js
 */
const SPORTS = [
  { name: "Soccer", slug: "soccer" },
];

const seedSports = async () => {
  console.log("Seeding sports...");

  for (const sport of SPORTS) {
    const result = await db.query(
      `INSERT INTO sports (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, name`,
      [sport.name, sport.slug]
    );

    if (result.rowCount > 0) {
      console.log(`Sport created: ${result.rows[0].name} (id=${result.rows[0].id})`);
    } else {
      console.log(`Sport already exists: ${sport.name} (slug=${sport.slug})`);
    }
  }
};

seedSports()
  .then(() => db.end())
  .catch((err) => {
    console.error("Seed failed:", err.message);
    db.end();
    process.exit(1);
  });
