import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { sportsService } from "./sports.service.js";

export const getSports = asyncHandler(async (req, res) => {
  const data = await sportsService.getAll();
  return sendSuccess(res, data);
});

export const createSport = asyncHandler(async (req, res) => {
  const data = await sportsService.create(req.body);
  return sendSuccess(res, data, HTTP_STATUS.CREATED);
});

export const updateSport = asyncHandler(async (req, res) => {
  const data = await sportsService.update(Number(req.params.id), req.body);
  if (!data) {
    return sendError(res, "Không tìm thấy môn thể thao.", HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, data);
});

export const deleteSport = asyncHandler(async (req, res) => {
  const deleted = await sportsService.remove(Number(req.params.id));
  if (!deleted) {
    return sendError(res, "Không tìm thấy môn thể thao.", HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, { id: Number(req.params.id) });
});
