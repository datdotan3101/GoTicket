import cron from "node-cron";
import { withTransaction } from "../src/config/db.js";
import { emitToMatch } from "../src/config/socket.js";
import { logger } from "../src/utils/logger.js";

export const startCleanupExpiredTicketsJob = () => {
  // Run every minute
  return cron.schedule("* * * * *", async () => {
    try {
      await withTransaction(async (tx) => {
        const run = (text, params) => tx.query(text, params);

        // Update expired pending tickets to 'cancelled'
        const result = await run(
          `UPDATE tickets
           SET status = 'cancelled'
           WHERE status = 'pending'
             AND created_at <= NOW() - INTERVAL '10 minutes'
           RETURNING id, match_id, seat_id`
        );

        const expiredTickets = result.rows;
        if (expiredTickets.length > 0) {
          const seatIds = expiredTickets.map(t => t.seat_id);

          // Set seats back to 'available'
          await run(
            `UPDATE seats
             SET status = 'available'
             WHERE id = ANY($1::bigint[])`,
            [seatIds]
          );

          logger.info(`[cleanupExpiredTickets] Released ${expiredTickets.length} expired ticket(s) and seat(s).`);

          // Emit realtime updates
          for (const ticket of expiredTickets) {
            emitToMatch(ticket.match_id, "seat:booked", {
              matchId: ticket.match_id,
              seatId: ticket.seat_id,
              ticketId: ticket.id,
              status: "available"
            });
          }
        }
      });
    } catch (error) {
      logger.error(`[cleanupExpiredTickets] Job failed: ${error.message}`);
    }
  });
};
