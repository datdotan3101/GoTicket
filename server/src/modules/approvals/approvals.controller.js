import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { approvalsService } from "./approvals.service.js";

/** GET /api/approvals/pending — All pending approvals (?type=match|user_account) */
export const pendingApprovals = asyncHandler(async (req, res) => {
  const data = await approvalsService.getPendingApprovals(req.query);
  return sendSuccess(res, data);
});

/** GET /api/approvals/:id — Approval detail with resource info */
export const getApprovalDetail = asyncHandler(async (req, res) => {
  const data = await approvalsService.getApprovalDetail(Number(req.params.id));
  if (!data) return sendError(res, "Approval not found.", HTTP_STATUS.NOT_FOUND);
  return sendSuccess(res, data);
});

/** POST /api/approvals/:id/approve — Approve an approval */
export const approve = asyncHandler(async (req, res) => {
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "approve",
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});

/** POST /api/approvals/:id/reject — Reject an approval with a reason */
export const reject = asyncHandler(async (req, res) => {
  if (!req.body.reason || req.body.reason.trim() === "") {
    return sendError(res, "Rejection reason is required.", HTTP_STATUS.BAD_REQUEST);
  }
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "reject",
    reason: req.body.reason.trim(),
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});
