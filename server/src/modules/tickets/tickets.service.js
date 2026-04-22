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

const generateTicketCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const ticketsService = {
  async bookTickets({ matchId, standId, quantity, userId }) {
    if (!standId || !quantity || quantity <= 0) {
      throw new Error("Thông tin đặt vé không hợp lệ.");
    }

    const bookedTickets = await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      
      // Tìm các ghế còn trống trong khán đài được chọn
      const seatResult = await run(
        `SELECT id, seat_label
         FROM seats
         WHERE match_id = $1 AND stand_id = $2 AND status = 'available'
         ORDER BY id ASC
         LIMIT $3
         FOR UPDATE SKIP LOCKED`,
        [matchId, standId, quantity]
      );

      const seats = seatResult.rows;
      if (seats.length < quantity) {
        throw new Error("Rất tiếc, khán đài này không còn đủ số lượng ghế bạn yêu cầu.");
      }

      const seatIds = seats.map(s => s.id);
      const ticketIds = [];
      const ticketCode = generateTicketCode();
      
      for (const seat of seats) {
        const ticketResult = await run(
          `INSERT INTO tickets (user_id, match_id, seat_id, status, ticket_code)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, user_id, match_id, seat_id, status, ticket_code, created_at`,
          [userId, matchId, seat.id, TICKET_STATUS.PENDING, ticketCode]
        );
        ticketIds.push(ticketResult.rows[0]);
      }

      await run(
        `UPDATE seats
         SET status = 'booked'
         WHERE id = ANY($1::bigint[])`,
        [seatIds]
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
      `SELECT t.ticket_code,
              string_agg(s.seat_label, ', ' ORDER BY s.id) as seat_labels,
              count(*) as quantity,
              st.name as stand_name,
              std.name as stadium_name,
              std.city as stadium_city,
              std.address as stadium_address,
              m.home_team,
              m.away_team,
              m.match_date,
              st.price as price,
              MIN(t.status) as status,
              MIN(t.created_at) as created_at,
              MAX(t.qr_token) as qr_token
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       JOIN stands st ON st.id = s.stand_id
       JOIN matches m ON m.id = t.match_id
       JOIN stadiums std ON std.id = m.stadium_id
       WHERE t.user_id = $1
       GROUP BY t.ticket_code, m.id, std.id, st.id, st.price
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};
