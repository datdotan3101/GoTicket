import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { leaguesService } from "./leagues.service.js";

export const getLeagues = asyncHandler(async (req, res) => {
  const data = await leaguesService.getAll(req.query);
  return sendSuccess(res, data);
});

export const getLeagueById = asyncHandler(async (req, res) => {
  const data = await leaguesService.getById(Number(req.params.id));
  if (!data) return sendError(res, "Không tìm thấy giải đấu.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const createLeague = asyncHandler(async (req, res) => {
  const data = await leaguesService.create(req.body, req.user.id);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const updateLeague = asyncHandler(async (req, res) => {
  const data = await leaguesService.update(Number(req.params.id), req.body);
  if (!data) return sendError(res, "Không tìm thấy giải đấu.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const deleteLeague = asyncHandler(async (req, res) => {
  const deleted = await leaguesService.remove(Number(req.params.id));
  if (!deleted) return sendError(res, "Không tìm thấy giải đấu.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});
