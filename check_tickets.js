import { query } from "./server/src/config/db.js";

async function checkTickets() {
  try {
    const tickets = await query(
      "SELECT status, COUNT(*) FROM tickets WHERE match_id = 33 GROUP BY status"
    );
    console.log("Tickets for match 33:", tickets.rows);
    
    const seats = await query(
      "SELECT status, COUNT(*) FROM seats WHERE match_id = 33 GROUP BY status"
    );
    console.log("Seats for match 33:", seats.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkTickets();
