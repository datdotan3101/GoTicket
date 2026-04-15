import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { checkinService } from "./checkin.service.js";

export const scanCheckin = asyncHandler(async (req, res) => {
  const data = await checkinService.scanQrToken(req.body.qrToken);
  return sendSuccess(res, data);
});

export const matchStats = asyncHandler(async (req, res) => {
  const data = await checkinService.getMatchCheckinStats(Number(req.params.id));
  return sendSuccess(res, data);
});
