import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { notificationsService } from "./notifications.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const data = await notificationsService.getMyNotifications(req.user.id);
  return sendSuccess(res, data);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markAsRead(Number(req.params.id), req.user.id);
  if (!data) {
    return sendError(res, "Không tìm thấy thông báo.", HTTP_STATUS.NOT_FOUND);
  }
  return sendSuccess(res, data);
});
