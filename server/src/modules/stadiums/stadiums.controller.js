import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { stadiumsService } from "./stadiums.service.js";

export const getStadiums = asyncHandler(async (req, res) => {
  const data = await stadiumsService.getAll();
  return sendSuccess(res, data);
});

export const createStadium = asyncHandler(async (req, res) => {
  const data = await stadiumsService.create(req.body);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const updateStadium = asyncHandler(async (req, res) => {
  const data = await stadiumsService.update(Number(req.params.id), req.body);
  if (!data) return sendError(res, "Không tìm thấy sân.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const deleteStadium = asyncHandler(async (req, res) => {
  const deleted = await stadiumsService.remove(Number(req.params.id));
  if (!deleted) return sendError(res, "Không tìm thấy sân.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, { id: Number(req.params.id) });
});
