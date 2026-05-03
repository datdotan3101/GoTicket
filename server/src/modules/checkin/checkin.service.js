import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";
import { emitToMatch } from "../../config/socket.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";

export const checkinService = {
  async scanQrToken(qrToken) {
    // ignoreExpiration: true → accept QR tokens past their exp date.
    // Signature is still verified — only the expiry check is skipped.
    const payload = jwt.verify(
      qrToken,
      process.env.QR_JWT_SECRET || process.env.JWT_SECRET,
      { ignoreExpiration: true }
    );
    
    let tickets = [];
    if (payload.ticketCode) {
      // Group Check-in
      const ticketResult = await query(
        `SELECT t.id, t.status, t.match_id, t.seat_id, s.status AS seat_status
         FROM tickets t
         JOIN seats s ON s.id = t.seat_id
         WHERE t.ticket_code = $1`,
        [payload.ticketCode]
      );
      tickets = ticketResult.rows;
    } else if (payload.ticketId) {
      // Legacy Single Check-in
      const ticketResult = await query(
        `SELECT t.id, t.status, t.match_id, t.seat_id, s.status AS seat_status
         FROM tickets t
         JOIN seats s ON s.id = t.seat_id
         WHERE t.id = $1`,
        [payload.ticketId]
      );
      tickets = ticketResult.rows;
    }

    if (tickets.length === 0) {
      throw new Error("Vé không tồn tại hoặc mã QR không hợp lệ.");
    }

    const matchId = tickets[0].match_id;
    const results = [];

    await withTransaction(async (tx) => {
      for (const ticket of tickets) {
        if (ticket.status !== TICKET_STATUS.PAID) continue;

        await tx.query("UPDATE tickets SET status = $1 WHERE id = $2", [TICKET_STATUS.CHECKED_IN, ticket.id]);
        await tx.query("UPDATE seats SET status = 'checked_in' WHERE id = $1", [ticket.seat_id]);
        
        results.push({
          ticketId: ticket.id,
          matchId: ticket.match_id,
          seatId: ticket.seat_id,
          status: "checked_in"
        });
      }
    });

    if (results.length === 0) {
      throw new Error("Tất cả vé trong nhóm này đã được check-in hoặc không ở trạng thái hợp lệ.");
    }

    for (const res of results) {
      emitToMatch(matchId, "seat:checked_in", res);
    }
    
    const stats = await this.getMatchCheckinStats(matchId);
    emitToMatch(matchId, "checkin:stats", stats);
    
    return { 
      message: `Đã check-in thành công ${results.length} vé.`,
      ticketId: results[0].ticketId,
      matchId: results[0].matchId,
      seatId: results[0].seatId,
      status: "checked_in",
      count: results.length
    };
  },

  async checkinByCode(ticketCode) {
    const ticketResult = await query(
      `SELECT t.id, t.status, t.match_id, t.seat_id, s.status AS seat_status
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       WHERE t.ticket_code = $1`,
      [ticketCode.toUpperCase()]
    );
    const tickets = ticketResult.rows;

    if (tickets.length === 0) {
      throw new Error("Mã vé không tồn tại.");
    }

    const matchId = tickets[0].match_id;
    const results = [];

    await withTransaction(async (tx) => {
      for (const ticket of tickets) {
        if (ticket.status !== TICKET_STATUS.PAID) continue;

        await tx.query("UPDATE tickets SET status = $1 WHERE id = $2", [TICKET_STATUS.CHECKED_IN, ticket.id]);
        await tx.query("UPDATE seats SET status = 'checked_in' WHERE id = $1", [ticket.seat_id]);
        
        results.push({
          ticketId: ticket.id,
          matchId: ticket.match_id,
          seatId: ticket.seat_id,
          status: "checked_in"
        });
      }
    });

    if (results.length === 0) {
      throw new Error("Vé này đã được check-in hoặc chưa thanh toán.");
    }

    for (const res of results) {
      emitToMatch(matchId, "seat:checked_in", res);
    }
    
    const stats = await this.getMatchCheckinStats(matchId);
    emitToMatch(matchId, "checkin:stats", stats);
    
    return { 
      message: "Check-in thành công.",
      ticketId: results[0].ticketId,
      matchId: results[0].matchId,
      seatId: results[0].seatId,
      status: "checked_in"
    };
  },

  async getMatchCheckinStats(matchId) {
    const overallResult = await query(
      `SELECT
         COUNT(*)::int AS total_tickets,
         COUNT(*) FILTER (WHERE status = 'checked_in')::int AS checked_in_tickets,
         COUNT(*) FILTER (WHERE status IN ('paid', 'pending'))::int AS not_checked_in_tickets
       FROM tickets
       WHERE match_id = $1`,
      [matchId]
    );

    const standsResult = await query(
      `SELECT 
         st.name as stand_name,
         st.total_seats as capacity,
         COUNT(t.id) FILTER (WHERE t.id IS NOT NULL)::int as sold_tickets,
         COUNT(t.id) FILTER (WHERE t.status = 'checked_in')::int as checked_in_tickets
       FROM stands st
       LEFT JOIN seats s ON s.stand_id = st.id
       LEFT JOIN tickets t ON t.seat_id = s.id
       WHERE st.match_id = $1
       GROUP BY st.id, st.name, st.total_seats
       ORDER BY st.name`,
      [matchId]
    );

    return {
      ...overallResult.rows[0],
      stands: standsResult.rows
    };
  }
};
