import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetDb() {
  try {
    console.log("Dropping and recreating public schema...");
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("✅ Database cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
  } finally {
    await pool.end();
  }
}

resetDb();
