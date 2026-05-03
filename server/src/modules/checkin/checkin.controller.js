import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { checkinService } from "./checkin.service.js";

export const scanCheckin = asyncHandler(async (req, res) => {
  try {
    const data = await checkinService.scanQrToken(req.body.qrToken);
    return sendSuccess(res, data);
  } catch (err) {
    // JWT errors for QR token must return 400, NOT 401.
    // A 401 from the global interceptor would trigger logout on the client.
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Mã QR không hợp lệ hoặc đã hết hạn.' });
    }
    throw err; // let global errorHandler handle other errors
  }
});

export const codeCheckin = asyncHandler(async (req, res) => {
  const data = await checkinService.checkinByCode(req.body.ticketCode);
  return sendSuccess(res, data);
});

export const confirmCheckin = asyncHandler(async (req, res) => {
  const data = await checkinService.confirmCheckin(req.body.ticketCode);
  return sendSuccess(res, data);
});

export const matchStats = asyncHandler(async (req, res) => {
  const data = await checkinService.getMatchCheckinStats(Number(req.params.id));
  return sendSuccess(res, data);
});
