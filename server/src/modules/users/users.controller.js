import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { usersService } from "./users.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getAll();
  return sendSuccess(res, data);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const data = await usersService.updateRole(Number(req.params.id), req.body.role, req.body.clubId);
  if (!data) return sendError(res, "Không tìm thấy user.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const data = await usersService.setActive(Number(req.params.id), Boolean(req.body.isActive));
  if (!data) return sendError(res, "Không tìm thấy user.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});
