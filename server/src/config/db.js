import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database calls will fail.");
}

const sslEnabled = connectionString?.includes("supabase.co");

export const db = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false
});

export const query = (text, params = []) => db.query(text, params);

export const withTransaction = async (handler) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
