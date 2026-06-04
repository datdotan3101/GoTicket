import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { ticketsService } from "./tickets.service.js";

/** POST /api/tickets/book — Book seats for a match (auth) */
export const bookTickets = asyncHandler(async (req, res) => {
  const data = await ticketsService.bookTickets({
    matchId: Number(req.body.matchId),
    standId: req.body.standId ? Number(req.body.standId) : undefined,
    quantity: req.body.quantity ? Number(req.body.quantity) : undefined,
    selections: req.body.selections,
    userId: req.user.id
  });
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

/** GET /api/tickets/my — My booked tickets (auth) */
export const myTickets = asyncHandler(async (req, res) => {
  const data = await ticketsService.getMyTickets(req.user.id);
  return sendSuccess(res, data);
});

/** DELETE /api/tickets/cancel — Cancel tickets by IDs (auth) */
export const cancelTickets = asyncHandler(async (req, res) => {
  const ticketIds = req.body.ticketIds;
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return sendError(res, "Invalid ticket IDs.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await ticketsService.cancelTickets({ ticketIds, userId: req.user.id });
  return sendSuccess(res, data);
});

/** POST /api/tickets/:ticketCode/gift — Gift a ticket to another user by email (auth) */
export const giftTicket = asyncHandler(async (req, res) => {
  const { ticketCode } = req.params;
  const { email } = req.body;
  if (!email) {
    return sendError(res, "Please enter an email.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await ticketsService.giftTicket({ userId: req.user.id, ticketCode, email });
  return sendSuccess(res, data);
});

/** GET /api/tickets/qr/:token — Generate QR code image from token (public) */
export const generateQrImage = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) return sendError(res, "Token required.", HTTP_STATUS.BAD_REQUEST);

  let qrData = token;
  let ticketCode = null;

  if (token.startsWith("ticket-group-")) {
    ticketCode = token.replace("ticket-group-", "");
  } else {
    try {
      const payload = jwt.decode(token);
      if (payload) ticketCode = payload.ticketCode;
    } catch (e) {
      // Ignore decoding errors — raw token will be used as QR data
    }
  }

  if (ticketCode) {
    const result = await query(
      `SELECT m.home_team, m.away_team, m.match_date, std.name as stadium_name
       FROM tickets t
       JOIN matches m ON m.id = t.match_id
       JOIN stadiums std ON std.id = m.stadium_id
       WHERE t.ticket_code = $1
       LIMIT 1`,
      [ticketCode]
    );

    if (result.rows.length > 0) {
      const match = result.rows[0];
      const matchDateStr = new Date(match.match_date).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
      qrData = JSON.stringify({
        token: token,
        ticketCode: ticketCode,
        match: `${match.home_team} vs ${match.away_team}`,
        date: matchDateStr,
        stadium: match.stadium_name
      });
    }
  }

  const buffer = await QRCode.toBuffer(qrData, {
    width: 280,
    margin: 2,
    type: "png",
    color: { dark: "#1e293b", light: "#ffffff" }
  });

  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
});
