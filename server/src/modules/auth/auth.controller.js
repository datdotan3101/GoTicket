import { validationResult } from "express-validator";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { authService } from "./auth.service.js";

const ensureValidation = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return true;
  }
  sendError(res, "Dữ liệu không hợp lệ.", HTTP_STATUS.BAD_REQUEST, errors.array());
  return false;
};

export const register = asyncHandler(async (req, res) => {
  if (!ensureValidation(req, res)) return;
  const user = await authService.register(req.body);
  return sendSuccess(res, user, HTTP_STATUS.CREATED);
});

export const login = asyncHandler(async (req, res) => {
  if (!ensureValidation(req, res)) return;
  const payload = await authService.login(req.body);
  return sendSuccess(res, payload);
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user.id);
  return sendSuccess(res, data);
});

export const onboarding = asyncHandler(async (req, res) => {
  const data = await authService.onboarding(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendError(res, "Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.", HTTP_STATUS.BAD_REQUEST);
  }
  if (newPassword.length < 6) {
    return sendError(res, "Mật khẩu mới phải có ít nhất 6 ký tự.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await authService.changePassword(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const data = await authService.deleteAccount(req.user.id);
  return sendSuccess(res, data);
});
