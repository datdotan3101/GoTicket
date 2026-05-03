import { query } from "./server/src/config/db.js";

async function checkStands() {
  try {
    const stands = await query(
      "SELECT id, name, total_seats FROM stands WHERE match_id = 13"
    );
    console.log("Stands for match 13:", stands.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkStands();
