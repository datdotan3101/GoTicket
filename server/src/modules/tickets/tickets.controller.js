import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { ticketsService } from "./tickets.service.js";

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

export const myTickets = asyncHandler(async (req, res) => {
  const data = await ticketsService.getMyTickets(req.user.id);
  return sendSuccess(res, data);
});

export const cancelTickets = asyncHandler(async (req, res) => {
  const ticketIds = req.body.ticketIds;
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid ticket IDs." });
  }
  const data = await ticketsService.cancelTickets({ ticketIds, userId: req.user.id });
  return sendSuccess(res, data);
});

export const giftTicket = asyncHandler(async (req, res) => {
  const { ticketCode } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập email." });
  }
  
  const data = await ticketsService.giftTicket({ userId: req.user.id, ticketCode, email });
  return sendSuccess(res, data);
});

export const generateQrImage = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).send("Token required");
  
  let qrData = token;
  let ticketCode = null;

  if (token.startsWith("ticket-group-")) {
    ticketCode = token.replace("ticket-group-", "");
  } else {
    try {
      const payload = jwt.decode(token);
      if (payload) ticketCode = payload.ticketCode;
    } catch (e) {
      // Bỏ qua lỗi giải mã
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
      const matchDateStr = new Date(match.match_date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
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
