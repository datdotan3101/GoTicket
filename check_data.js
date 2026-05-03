import { query } from "./server/src/config/db.js";

async function checkData() {
  try {
    const standResult = await query("SELECT match_id FROM stands WHERE id = 33");
    if (standResult.rowCount === 0) {
      console.log("Stand 33 not found.");
      return;
    }
    const matchId = standResult.rows[0].match_id;
    console.log("Match ID for Stand 33:", matchId);

    const tickets = await query(
      "SELECT status, COUNT(*) FROM tickets WHERE match_id = $1 GROUP BY status",
      [matchId]
    );
    console.log(`Tickets for match ${matchId}:`, tickets.rows);
    
    const seats = await query(
      "SELECT status, COUNT(*) FROM seats WHERE match_id = $1 GROUP BY status",
      [matchId]
    );
    console.log(`Seats for match ${matchId}:`, seats.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkData();
