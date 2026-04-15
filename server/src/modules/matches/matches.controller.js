import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { generateStands } from "../../utils/standGenerator.js";
import { matchesService } from "./matches.service.js";

export const getMatches = asyncHandler(async (req, res) => {
  const data = await matchesService.getAll(req.query);
  return sendSuccess(res, data);
});

export const getMatchById = asyncHandler(async (req, res) => {
  const data = await matchesService.getById(Number(req.params.id));
  if (!data) {
    return sendError(res, "Không tìm thấy trận đấu.", HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, data);
});

export const getMatchSeats = asyncHandler(async (req, res) => {
  const data = await matchesService.getSeatsByMatchId(Number(req.params.id));
  return sendSuccess(res, data);
});

export const createMatch = asyncHandler(async (req, res) => {
  const data = await matchesService.create(req.body, req.user);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const submitMatch = asyncHandler(async (req, res) => {
  const data = await matchesService.submitForApproval(Number(req.params.id), req.user.id);
  return sendSuccess(res, data);
});

export const previewStands = asyncHandler(async (req, res) => {
  const data = generateStands(req.body.totalCapacity, req.body.prices);
  return sendSuccess(res, data);
});

export const configureStands = asyncHandler(async (req, res) => {
  const data = await matchesService.configureStands(Number(req.params.id), req.body, req.user);
  return sendSuccess(res, data);
});
