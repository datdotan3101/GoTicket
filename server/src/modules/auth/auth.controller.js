
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { authService } from "./auth.service.js";



export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return sendSuccess(res, user, HTTP_STATUS.CREATED);
});

export const login = asyncHandler(async (req, res) => {
  const payload = await authService.login(req.body);
  return sendSuccess(res, payload);
});

export const googleLogin = asyncHandler(async (req, res) => {
  const payload = await authService.googleLogin(req.body);
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
    return sendError(res, "Please provide both the current password and the new password.", HTTP_STATUS.BAD_REQUEST);
  }
  if (newPassword.length < 6) {
    return sendError(res, "New password must be at least 6 characters.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await authService.changePassword(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const data = await authService.deleteAccount(req.user.id);
  return sendSuccess(res, data);
});

export const logout = asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  const token = header.replace("Bearer ", "");
  await authService.logout(token, req.user);
  return sendSuccess(res, { message: "Logged out successfully." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  return sendSuccess(res, data);
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const data = await authService.verifyOTP(req.body);
  return sendSuccess(res, data);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  return sendSuccess(res, data);
});
