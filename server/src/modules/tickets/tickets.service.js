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
  async bookTickets({ matchId, selections, standId, quantity, userId }) {
    const finalSelections = selections || [{ standId, quantity }];
    
    if (!finalSelections || finalSelections.length === 0) {
      throw new Error("Thông tin đặt vé không hợp lệ.");
    }

    const bookedTickets = await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      const allBooked = [];
      const ticketCode = generateTicketCode();

      for (const sel of finalSelections) {
        if (!sel.standId || !sel.quantity || sel.quantity <= 0) continue;

        // Tìm các ghế còn trống trong khán đài được chọn
        const seatResult = await run(
          `SELECT id, seat_label
           FROM seats
           WHERE match_id = $1 AND stand_id = $2 AND status = 'available'
           ORDER BY id ASC
           LIMIT $3
           FOR UPDATE SKIP LOCKED`,
          [matchId, sel.standId, sel.quantity]
        );

        const seats = seatResult.rows;
        if (seats.length < sel.quantity) {
          throw new Error(`Rất tiếc, khán đài ID ${sel.standId} không còn đủ số lượng ghế bạn yêu cầu.`);
        }

        const seatIds = seats.map(s => s.id);
        
        for (const seat of seats) {
          const ticketResult = await run(
            `INSERT INTO tickets (user_id, match_id, seat_id, status, ticket_code)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id, match_id, seat_id, status, ticket_code, created_at`,
            [userId, matchId, seat.id, TICKET_STATUS.PENDING, ticketCode]
          );
          allBooked.push(ticketResult.rows[0]);
        }

        await run(
          `UPDATE seats
           SET status = 'booked'
           WHERE id = ANY($1::bigint[])`,
          [seatIds]
        );
      }
      
      return allBooked;
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
      `SELECT sub.ticket_code,
              json_agg(json_build_object(
                'name', st.name,
                'quantity', sub.qty,
                'price', st.price
              )) as sections,
              SUM(st.price * sub.qty) as total_price,
              SUM(sub.qty) as total_quantity,
              std.name as stadium_name,
              std.city as stadium_city,
              std.address as stadium_address,
              m.home_team,
              m.away_team,
              m.match_date,
              sub.status,
              sub.created_at,
              sub.qr_token
       FROM (
         SELECT t.ticket_code, t.match_id, t.stand_id, count(*) as qty, 
                MIN(t.status) as status, MIN(t.created_at) as created_at, MAX(t.qr_token) as qr_token
         FROM (
           SELECT t2.*, s2.stand_id 
           FROM tickets t2
           JOIN seats s2 ON s2.id = t2.seat_id
         ) t
         WHERE t.user_id = $1 AND t.status IN ('paid', 'checked_in')
         GROUP BY t.ticket_code, t.match_id, t.stand_id
       ) sub
       JOIN stands st ON st.id = sub.stand_id
       JOIN matches m ON m.id = sub.match_id
       JOIN stadiums std ON std.id = m.stadium_id
       GROUP BY sub.ticket_code, m.id, std.id, sub.status, sub.created_at, sub.qr_token
       ORDER BY sub.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async cancelTickets({ ticketIds, userId }) {
    return await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      
      const ticketResult = await run(
        `UPDATE tickets
         SET status = 'cancelled'
         WHERE id = ANY($1::bigint[])
           AND user_id = $2
           AND status = 'pending'
         RETURNING id, match_id, seat_id`,
        [ticketIds, userId]
      );
      
      const cancelledTickets = ticketResult.rows;
      if (cancelledTickets.length === 0) return [];
      
      const seatIds = cancelledTickets.map(t => t.seat_id);
      
      await run(
        `UPDATE seats
         SET status = 'available'
         WHERE id = ANY($1::bigint[])`,
        [seatIds]
      );
      
      for (const ticket of cancelledTickets) {
        emitToMatch(ticket.match_id, "seat:booked", {
          matchId: ticket.match_id,
          seatId: ticket.seat_id,
          ticketId: ticket.id,
          status: "available"
        });
      }
      
      return cancelledTickets;
    });
  }
};
