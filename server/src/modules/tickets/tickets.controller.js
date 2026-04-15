import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ticketsService } from "./tickets.service.js";

export const bookTickets = asyncHandler(async (req, res) => {
  const data = await ticketsService.bookTickets({
    matchId: Number(req.body.matchId),
    seatIds: req.body.seatIds,
    userId: req.user.id
  });
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const myTickets = asyncHandler(async (req, res) => {
  const data = await ticketsService.getMyTickets(req.user.id);
  return sendSuccess(res, data);
});
