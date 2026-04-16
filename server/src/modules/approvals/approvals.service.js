import { APPROVAL_RESOURCE_MAP } from "../../constants/approvalConfig.js";
import { query, withTransaction } from "../../config/db.js";
import { notificationsService } from "../notifications/notifications.service.js";

export const approvalsService = {
  /**
   * Lấy danh sách approval đang pending.
   * Có thể filter by resource_type: 'match' | 'news' | 'user_account'
   */
  async getPendingApprovals(queryParams = {}) {
    const { type } = queryParams;

    const conditions = ["a.status = 'pending'"];
    const values = [];
    let idx = 1;

    if (type) {
      conditions.push(`a.resource_type = $${idx++}`);
      values.push(type);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const result = await query(
      `SELECT a.*,
              u.email AS submitted_by_email,
              u.full_name AS submitted_by_name
       FROM approvals a
       LEFT JOIN users u ON u.id = a.submitted_by
       ${where}
       ORDER BY a.created_at ASC`,
      values
    );
    return result.rows;
  },

  /**
   * Lấy chi tiết một approval record kèm thông tin resource.
   */
  async getApprovalDetail(approvalId) {
    const approvalResult = await query(
      `SELECT a.*,
              u.email AS submitted_by_email,
              u.full_name AS submitted_by_name,
              r.email AS reviewed_by_email,
              r.full_name AS reviewed_by_name
       FROM approvals a
       LEFT JOIN users u ON u.id = a.submitted_by
       LEFT JOIN users r ON r.id = a.reviewed_by
       WHERE a.id = $1
       LIMIT 1`,
      [approvalId]
    );

    if (approvalResult.rowCount === 0) return null;

    const approval = approvalResult.rows[0];
    const config = APPROVAL_RESOURCE_MAP[approval.resource_type];
    if (!config) return approval;

    // Lấy thêm thông tin của resource (match hoặc news)
    if (approval.resource_type !== "user_account") {
      const resourceResult = await query(
        `SELECT * FROM ${config.table} WHERE id = $1 LIMIT 1`,
        [approval.resource_id]
      );
      approval.resource = resourceResult.rows[0] || null;
    } else {
      const userResult = await query(
        "SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1 LIMIT 1",
        [approval.resource_id]
      );
      approval.resource = userResult.rows[0] || null;
    }

    return approval;
  },

  /**
   * Xử lý duyệt hoặc từ chối một approval.
   *
   * Logic xử lý scheduled_publish_at:
   * - match/news được duyệt + có scheduled_publish_at → status = 'approved' (cron sẽ publish đúng giờ)
   * - match/news được duyệt + KHÔNG có scheduled_publish_at → status = 'published' ngay
   * - user_account được duyệt → is_approved = true
   */
  async processApproval({ approvalId, action, reason, adminId }) {
    const approvalResult = await query("SELECT * FROM approvals WHERE id = $1", [approvalId]);
    if (approvalResult.rowCount === 0) {
      throw new Error("Approval không tồn tại.");
    }

    const approval = approvalResult.rows[0];
    if (approval.status !== "pending") {
      throw new Error("Approval này đã được xử lý rồi.");
    }

    const config = APPROVAL_RESOURCE_MAP[approval.resource_type];
    if (!config) {
      throw new Error(`Resource type '${approval.resource_type}' chưa được hỗ trợ.`);
    }

    const isApprove = action === "approve";
    const approvalStatus = isApprove ? "approved" : "rejected";

    // Tính trạng thái mới cho resource
    let resourceStatus;
    if (isApprove) {
      if (approval.resource_type === "user_account") {
        // user_account: cập nhật is_approved = true (không dùng status)
        resourceStatus = config.approvedStatus; // true
      } else {
        // match/news: nếu có scheduled_publish_at → approved (cron publish), không có → published ngay
        const hasSchedule = !!approval.scheduled_publish_at;
        resourceStatus = hasSchedule ? config.approvedStatus : "published";
      }
    } else {
      resourceStatus = config.rejectedStatus;
    }

    const notificationPayload = {
      userId: approval.submitted_by,
      type: "approval",
      title: isApprove ? config.approvedTitle : config.rejectedTitle,
      body: isApprove
        ? (approval.scheduled_publish_at
            ? `Yêu cầu đã được duyệt. Sẽ tự động đăng lúc ${new Date(approval.scheduled_publish_at).toLocaleString("vi-VN")}.`
            : "Yêu cầu đã được duyệt và đã được đăng.")
        : (reason || "Yêu cầu bị từ chối."),
      relatedId: approval.resource_id,
      relatedType: approval.resource_type
    };

    await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);

      if (approval.resource_type === "user_account") {
        // Khoá/mở tài khoản qua is_approved
        await run("UPDATE users SET is_approved = $1, updated_at = NOW() WHERE id = $2", [
          resourceStatus, // true hoặc false
          approval.resource_id
        ]);
      } else {
        // Cập nhật status của match/news
        const updateFields = [`status = $1`];
        const updateValues = [resourceStatus, approval.resource_id];
        let fieldIdx = 3;

        // Nếu published ngay (không có schedule) → set published_at = NOW()
        if (isApprove && !approval.scheduled_publish_at) {
          updateFields.push(`published_at = NOW()`);
        }

        await run(
          `UPDATE ${config.table} SET ${updateFields.join(", ")} WHERE id = $2`,
          updateValues
        );
      }

      // Cập nhật approval record
      await run(
        `UPDATE approvals
         SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
         WHERE id = $4`,
        [approvalStatus, reason || null, adminId, approvalId]
      );
    });

    // Gửi notification sau khi transaction commit
    await notificationsService.createNotification(notificationPayload);

    return { id: approvalId, status: approvalStatus, resourceStatus };
  }
};
