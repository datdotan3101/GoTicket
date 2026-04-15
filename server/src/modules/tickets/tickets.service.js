import { query, withTransaction } from "../../config/db.js";
import { emitToMatch } from "../../config/socket.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";
import { validateSeatSelection } from "../../utils/seatValidation.js";

const getSeatRowsForBooking = async (runner, matchId, seatIds) => {
  const result = await runner(
    `SELECT s.id, s.row_number, s.seat_number, s.status
     FROM seats s
     WHERE s.match_id = $1 AND s.id = ANY($2::bigint[])
     FOR UPDATE`,
    [matchId, seatIds]
  );
  return result.rows;
};

export const ticketsService = {
  async bookTickets({ matchId, seatIds, userId }) {
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new Error("Bạn phải chọn ít nhất 1 ghế.");
    }

    const bookedTickets = await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      const seats = await getSeatRowsForBooking(run, matchId, seatIds);
      if (seats.length !== seatIds.length) {
        throw new Error("Một số ghế không tồn tại.");
      }

      const unavailable = seats.find((seat) => seat.status !== "available");
      if (unavailable) {
        throw new Error("Một số ghế đã được đặt.");
      }

      const seatValidation = validateSeatSelection(seats);
      if (!seatValidation.valid) {
        throw new Error(seatValidation.message);
      }

      const ticketIds = [];
      for (const seat of seats) {
        const ticketResult = await run(
          `INSERT INTO tickets (user_id, match_id, seat_id, status)
           VALUES ($1, $2, $3, $4)
           RETURNING id, user_id, match_id, seat_id, status, created_at`,
          [userId, matchId, seat.id, TICKET_STATUS.PENDING]
        );
        ticketIds.push(ticketResult.rows[0]);
      }

      await run(
        `UPDATE seats
         SET status = 'booked'
         WHERE match_id = $1 AND id = ANY($2::bigint[])`,
        [matchId, seatIds]
      );
      return ticketIds;
    });

    for (const ticket of bookedTickets) {
      emitToMatch(matchId, "seat:booked", {
        matchId,
        seatId: ticket.seat_id,
        ticketId: ticket.id,
        status: "booked"
      });
    }

    return bookedTickets;
  },

  async getMyTickets(userId) {
    const result = await query(
      `SELECT t.*,
              s.seat_label,
              m.home_team,
              m.away_team,
              m.match_date
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       JOIN matches m ON m.id = t.match_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};
