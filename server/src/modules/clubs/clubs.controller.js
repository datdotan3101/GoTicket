import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { clubsService } from "./clubs.service.js";

export const getClubs = asyncHandler(async (req, res) => {
  const data = await clubsService.getAll(req.query);
  return sendSuccess(res, data);
});

export const getClubById = asyncHandler(async (req, res) => {
  const data = await clubsService.getById(Number(req.params.id));
  if (!data) return sendError(res, "Không tìm thấy CLB.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const createClub = asyncHandler(async (req, res) => {
  const data = await clubsService.create(req.body);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const updateClub = asyncHandler(async (req, res) => {
  const data = await clubsService.update(Number(req.params.id), req.body);
  if (!data) return sendError(res, "Không tìm thấy CLB.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const deleteClub = asyncHandler(async (req, res) => {
  const deleted = await clubsService.remove(Number(req.params.id));
  if (!deleted) return sendError(res, "Không tìm thấy CLB.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});
