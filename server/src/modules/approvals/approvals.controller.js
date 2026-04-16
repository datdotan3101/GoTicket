import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { approvalsService } from "./approvals.service.js";

/**
 * GET /api/approvals/pending — Tất cả approvals đang pending
 * Query ?type=match|news|user_account để filter theo loại
 */
export const pendingApprovals = asyncHandler(async (req, res) => {
  const data = await approvalsService.getPendingApprovals(req.query);
  return sendSuccess(res, data);
});

/**
 * GET /api/approvals/:id — Chi tiết approval kèm thông tin resource
 */
export const getApprovalDetail = asyncHandler(async (req, res) => {
  const data = await approvalsService.getApprovalDetail(Number(req.params.id));
  if (!data) return sendError(res, "Không tìm thấy approval.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/**
 * POST /api/approvals/:id/approve — Duyệt approval
 */
export const approve = asyncHandler(async (req, res) => {
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "approve",
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});

/**
 * POST /api/approvals/:id/reject — Từ chối approval kèm lý do
 */
export const reject = asyncHandler(async (req, res) => {
  if (!req.body.reason || req.body.reason.trim() === "") {
    return sendError(res, "Lý do từ chối là bắt buộc.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "reject",
    reason: req.body.reason.trim(),
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});
