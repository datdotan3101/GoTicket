import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";
import { emitToMatch } from "../../config/socket.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";

export const checkinService = {
  async scanQrToken(qrToken) {
    let tokenStr = qrToken;
    try {
      const parsed = JSON.parse(qrToken);
      if (parsed && parsed.token) {
        tokenStr = parsed.token;
      }
    } catch (e) {
      // Không phải JSON, giữ nguyên token ban đầu
    }

    let ticketCode = null;
    let ticketId = null;

    if (tokenStr.startsWith("ticket-group-")) {
      ticketCode = tokenStr.replace("ticket-group-", "");
    } else {
      const payload = jwt.decode(tokenStr);
      if (!payload) {
        throw new Error("Mã QR không thể giải mã.");
      }
      ticketCode = payload.ticketCode;
      ticketId = payload.ticketId;
    }

    
    let tickets = [];
    if (ticketCode) {
      // Group Check-in
      const ticketResult = await query(
        `SELECT t.id, t.status, t.match_id, t.seat_id, t.ticket_code, s.status AS seat_status, s.seat_label, u.full_name
         FROM tickets t
         JOIN seats s ON s.id = t.seat_id
         JOIN users u ON u.id = t.user_id
         WHERE t.ticket_code = $1`,
        [ticketCode]
      );
      tickets = ticketResult.rows;
    } else if (ticketId) {
      // Legacy Single Check-in
      const ticketResult = await query(
        `SELECT t.id, t.status, t.match_id, t.seat_id, t.ticket_code, s.status AS seat_status, s.seat_label, u.full_name
         FROM tickets t
         JOIN seats s ON s.id = t.seat_id
         JOIN users u ON u.id = t.user_id
         WHERE t.id = $1`,
        [ticketId]
      );
      tickets = ticketResult.rows;
    }

    if (tickets.length === 0) {
      throw new Error("Vé không tồn tại hoặc mã QR không hợp lệ.");
    }

    const isAlreadyCheckedIn = tickets.every(t => t.status === TICKET_STATUS.CHECKED_IN);
    const seatLabels = tickets.map(t => t.seat_label).join(", ");
    
    return {
      message: "Thông tin vé",
      ticketId: tickets[0].id,
      ticketCode: tickets[0].ticket_code,
      matchId: tickets[0].match_id,
      status: tickets[0].status,
      fullName: tickets[0].full_name,
      count: tickets.length,
      seatLabels: seatLabels,
      alreadyCheckedIn: isAlreadyCheckedIn
    };
  },

  async checkinByCode(ticketCode) {
    const ticketResult = await query(
      `SELECT t.id, t.status, t.match_id, t.seat_id, t.ticket_code, s.status AS seat_status, s.seat_label, u.full_name
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       JOIN users u ON u.id = t.user_id
       WHERE t.ticket_code = $1`,
      [ticketCode.toUpperCase()]
    );
    const tickets = ticketResult.rows;

    if (tickets.length === 0) {
      throw new Error("Mã vé không tồn tại.");
    }

    const isAlreadyCheckedIn = tickets.every(t => t.status === TICKET_STATUS.CHECKED_IN);
    const seatLabels = tickets.map(t => t.seat_label).join(", ");

    return {
      message: "Thông tin vé",
      ticketId: tickets[0].id,
      ticketCode: tickets[0].ticket_code,
      matchId: tickets[0].match_id,
      status: tickets[0].status,
      fullName: tickets[0].full_name,
      count: tickets.length,
      seatLabels: seatLabels,
      alreadyCheckedIn: isAlreadyCheckedIn
    };
  },

  async confirmCheckin(ticketCode) {
    const ticketResult = await query(
      `SELECT t.id, t.status, t.match_id, t.seat_id, t.ticket_code, s.status AS seat_status, s.seat_label, u.full_name
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       JOIN users u ON u.id = t.user_id
       WHERE t.ticket_code = $1`,
      [ticketCode]
    );
    const tickets = ticketResult.rows;

    if (tickets.length === 0) {
      throw new Error("Mã vé không tồn tại.");
    }

    const matchId = tickets[0].match_id;
    const results = [];

    await withTransaction(async (tx) => {
      for (const ticket of tickets) {
        if (ticket.status !== TICKET_STATUS.PAID && ticket.status !== TICKET_STATUS.PENDING) continue; // Allow checkin for testing

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
      const isAlreadyCheckedIn = tickets.every(t => t.status === TICKET_STATUS.CHECKED_IN);
      return {
        message: isAlreadyCheckedIn ? "Vé đã được sử dụng." : "Vé không ở trạng thái hợp lệ để check-in.",
        ticketCode: tickets[0].ticket_code,
        alreadyCheckedIn: isAlreadyCheckedIn
      };
    }

    for (const res of results) {
      emitToMatch(matchId, "seat:checked_in", res);
    }
    
    const stats = await this.getMatchCheckinStats(matchId);
    emitToMatch(matchId, "checkin:stats", stats);
    
    return { 
      message: "Check-in thành công.",
      ticketCode: tickets[0].ticket_code,
      alreadyCheckedIn: false
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
