import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:12345678@localhost:5432/postgres" // Connect to default DB
});

async function createDb() {
  try {
    await pool.query("CREATE DATABASE goticket");
    console.log("✅ Database 'goticket' created successfully");
  } catch (error) {
    if (error.code === '42P04') {
      console.log("ℹ️ Database 'goticket' already exists");
    } else {
      console.error("❌ Failed to create database:", error);
    }
  } finally {
    await pool.end();
  }
}

createDb();
