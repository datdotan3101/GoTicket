import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { usersService } from "./users.service.js";

/**
 * GET /api/users — Danh sách users với filter/pagination (admin)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getAll(req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/users/pending — Users đang chờ duyệt tài khoản (admin)
 */
export const getPendingUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getPendingApproval();
  return sendSuccess(res, data);
});

/**
 * GET /api/users/:id — Chi tiết user (admin)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const data = await usersService.getById(Number(req.params.id));
  if (!data) return sendError(res, "Không tìm thấy user.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * PUT /api/users/:id/role — Cập nhật role + club_id (admin)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const data = await usersService.updateRole(Number(req.params.id), req.body.role, req.body.clubId);
  if (!data) return sendError(res, "Không tìm thấy user.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * PUT /api/users/:id/active — Khoá / mở khoá tài khoản (admin)
 */
export const toggleUserActive = asyncHandler(async (req, res) => {
  const data = await usersService.setActive(Number(req.params.id), Boolean(req.body.isActive));
  if (!data) return sendError(res, "Không tìm thấy user.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});
