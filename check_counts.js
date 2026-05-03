
import { query } from "./server/src/config/db.js";

async function checkCounts() {
  try {
    const stands = await query("SELECT id, name, total_seats FROM stands");
    console.log("Stands:", stands.rows);
    
    for (const stand of stands.rows) {
      const counts = await query(
        "SELECT status, COUNT(*) FROM seats WHERE stand_id = $1 GROUP BY status",
        [stand.id]
      );
      console.log(`Stand ${stand.name} (id: ${stand.id}) counts:`, counts.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkCounts();
