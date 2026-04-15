import jwt from "jsonwebtoken";
import { query, withTransaction } from "../../config/db.js";
import { emitToMatch } from "../../config/socket.js";
import { TICKET_STATUS } from "../../constants/ticketStatus.js";

export const checkinService = {
  async scanQrToken(qrToken) {
    const payload = jwt.verify(qrToken, process.env.QR_JWT_SECRET || process.env.JWT_SECRET);
    const ticketResult = await query(
      `SELECT t.id, t.status, t.match_id, t.seat_id, s.status AS seat_status
       FROM tickets t
       JOIN seats s ON s.id = t.seat_id
       WHERE t.id = $1`,
      [payload.ticketId]
    );
    if (ticketResult.rowCount === 0) {
      throw new Error("Vé không tồn tại.");
    }

    const ticket = ticketResult.rows[0];
    if (ticket.status !== TICKET_STATUS.PAID) {
      throw new Error("Vé không ở trạng thái có thể check-in.");
    }

    await withTransaction(async (tx) => {
      await tx.query("UPDATE tickets SET status = $1 WHERE id = $2", [TICKET_STATUS.CHECKED_IN, ticket.id]);
      await tx.query("UPDATE seats SET status = 'checked_in' WHERE id = $1", [ticket.seat_id]);
    });

    const result = {
      ticketId: ticket.id,
      matchId: ticket.match_id,
      seatId: ticket.seat_id,
      status: "checked_in"
    };
    emitToMatch(ticket.match_id, "seat:checked_in", result);
    const stats = await this.getMatchCheckinStats(ticket.match_id);
    emitToMatch(ticket.match_id, "checkin:stats", stats);
    return result;
  },

  async getMatchCheckinStats(matchId) {
    const result = await query(
      `SELECT
         COUNT(*)::int AS total_tickets,
         COUNT(*) FILTER (WHERE status = 'checked_in')::int AS checked_in_tickets,
         COUNT(*) FILTER (WHERE status IN ('paid', 'pending'))::int AS not_checked_in_tickets
       FROM tickets
       WHERE match_id = $1`,
      [matchId]
    );
    return result.rows[0];
  }
};
