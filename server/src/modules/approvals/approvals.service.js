import { APPROVAL_RESOURCE_MAP } from "../../constants/approvalConfig.js";
import { query, withTransaction } from "../../config/db.js";
import { notificationsService } from "../notifications/notifications.service.js";

export const approvalsService = {
  async getPendingApprovals() {
    const result = await query(
      `SELECT a.*, u.email AS submitted_by_email
       FROM approvals a
       LEFT JOIN users u ON u.id = a.submitted_by
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC`
    );
    return result.rows;
  },

  async processApproval({ approvalId, action, reason, adminId }) {
    const approvalResult = await query("SELECT * FROM approvals WHERE id = $1", [approvalId]);
    if (approvalResult.rowCount === 0) {
      throw new Error("Approval không tồn tại.");
    }

    const approval = approvalResult.rows[0];
    const config = APPROVAL_RESOURCE_MAP[approval.resource_type];
    if (!config) {
      throw new Error("Resource type chưa được hỗ trợ.");
    }

    const isApprove = action === "approve";
    const approvalStatus = isApprove ? "approved" : "rejected";
    const notificationPayload = {
      userId: approval.submitted_by,
      type: "approval",
      title: isApprove ? config.approvedTitle : config.rejectedTitle,
      body: isApprove ? "Yêu cầu đã được duyệt." : reason || "Yêu cầu bị từ chối.",
      relatedId: approval.resource_id,
      relatedType: approval.resource_type
    };

    await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);
      if (approval.resource_type === "user_account") {
        await run("UPDATE users SET is_approved = $1 WHERE id = $2", [
          isApprove ? config.approvedStatus : config.rejectedStatus,
          approval.resource_id
        ]);
      } else {
        await run(`UPDATE ${config.table} SET status = $1 WHERE id = $2`, [
          isApprove ? config.approvedStatus : config.rejectedStatus,
          approval.resource_id
        ]);
      }

      await run(
        `UPDATE approvals
         SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
         WHERE id = $4`,
        [approvalStatus, reason || null, adminId, approvalId]
      );
    });
    await notificationsService.createNotification(notificationPayload);

    return { id: approvalId, status: approvalStatus };
  }
};
