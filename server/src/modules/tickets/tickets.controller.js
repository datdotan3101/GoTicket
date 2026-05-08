import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
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
