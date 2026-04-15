import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { approvalsService } from "./approvals.service.js";

export const pendingApprovals = asyncHandler(async (req, res) => {
  const data = await approvalsService.getPendingApprovals();
  return sendSuccess(res, data);
});

export const approve = asyncHandler(async (req, res) => {
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "approve",
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});

export const reject = asyncHandler(async (req, res) => {
  const data = await approvalsService.processApproval({
    approvalId: Number(req.params.id),
    action: "reject",
    reason: req.body.reason,
    adminId: req.user.id
  });
  return sendSuccess(res, data);
});
