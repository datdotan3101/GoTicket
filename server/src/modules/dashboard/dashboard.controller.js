import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { dashboardService } from "./dashboard.service.js";

/**
 * GET /api/dashboard/admin/revenue — Admin only
 */
export const adminRevenue = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminRevenue();
  return sendSuccess(res, data);
});

/**
 * GET /api/dashboard/manager/revenue — Manager only
 * club_id lấy từ JWT, không cần frontend truyền.
 */
export const managerRevenue = asyncHandler(async (req, res) => {
  if (!req.user.club_id) {
    return sendError(res, "Bạn chưa được gán vào câu lạc bộ.", HTTP_STATUS.FORBIDDEN);
  }
  const data = await dashboardService.getManagerRevenue(req.user.club_id);
  return sendSuccess(res, data);
});

/**
 * GET /api/dashboard/manager/match/:id — Manager only
 * Chỉ trả về analytics nếu trận thuộc CLB của manager.
 */
export const matchAnalytics = asyncHandler(async (req, res) => {
  if (!req.user.club_id) {
    return sendError(res, "Bạn chưa được gán vào câu lạc bộ.", HTTP_STATUS.FORBIDDEN);
  }
  const data = await dashboardService.getMatchAnalytics(
    Number(req.params.id),
    req.user.club_id
  );
  return sendSuccess(res, data);
});
