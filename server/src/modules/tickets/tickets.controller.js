import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import QRCode from "qrcode";
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
  
  const buffer = await QRCode.toBuffer(token, {
    width: 280,
    margin: 2,
    type: "png",
    color: { dark: "#1e293b", light: "#ffffff" }
  });
  
  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
});
