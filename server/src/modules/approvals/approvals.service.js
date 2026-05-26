import { APPROVAL_RESOURCE_MAP } from "../../constants/approvalConfig.js";
import { query, withTransaction } from "../../config/db.js";
import { notificationsService } from "../notifications/notifications.service.js";

export const approvalsService = {
  /**
   * Get list of pending approvals.
   * Can filter by resource_type: 'match' | 'news' | 'user_account'
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

    const where = `WHERE ${conditions.join(" AND ")} AND (a.resource_type != 'match' OR m.id IS NOT NULL)`;

    const result = await query(
      `SELECT a.*,
              u.email AS submitted_by_email,
              u.full_name AS submitted_by_name,
              m.home_team,
              m.away_team,
              m.match_date,
              m.thumbnail_url,
              m.ticket_sale_open_at,
              s.name AS stadium_name,
              s.address AS stadium_address,
              c.name AS club_name,
              (
                SELECT json_agg(json_build_object('name', st.name, 'price', st.price, 'total_seats', st.total_seats))
                FROM stands st
                WHERE st.match_id = m.id
              ) AS stands
       FROM approvals a
       LEFT JOIN users u ON u.id = a.submitted_by
       LEFT JOIN matches m ON a.resource_type = 'match' AND a.resource_id = m.id
       LEFT JOIN stadiums s ON m.stadium_id = s.id
       LEFT JOIN clubs c ON m.club_id = c.id
       ${where}
       ORDER BY a.created_at ASC`,
      values
    );
    return result.rows;
  },

  /**
   * Get detail of a single approval record with resource info.
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

    // Fetch additional info for the resource (match or news)
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
   * Process an approval decision (approve or reject).
   *
   * Logic for scheduled_publish_at:
   * - match/news approved + has scheduled_publish_at → status = 'approved' (cron will publish at the scheduled time)
   * - match/news approved + NO scheduled_publish_at → status = 'published' immediately
   * - user_account approved → is_approved = true
   */
  async processApproval({ approvalId, action, reason, adminId }) {
    const approvalResult = await query("SELECT * FROM approvals WHERE id = $1", [approvalId]);
    if (approvalResult.rowCount === 0) {
      throw new Error("Approval not found.");
    }

    const approval = approvalResult.rows[0];
    if (approval.status !== "pending") {
      throw new Error("This approval has already been processed.");
    }

    const config = APPROVAL_RESOURCE_MAP[approval.resource_type];
    if (!config) {
      throw new Error(`Resource type '${approval.resource_type}' is not supported.`);
    }

    const isApprove = action === "approve";
    const approvalStatus = isApprove ? "approved" : "rejected";

    // Calculate the new status for the resource
    let resourceStatus;
    if (isApprove) {
      if (approval.resource_type === "user_account") {
        // user_account: set is_approved = true (no status field)
        resourceStatus = config.approvedStatus; // true
      } else {
        // match/news: if has scheduled_publish_at → approved (cron publishes), otherwise → published immediately
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
            ? `Your request has been approved. It will be published automatically at ${new Date(approval.scheduled_publish_at).toLocaleString("en-US")}.`
            : "Your request has been approved and published.")
        : (reason || "Your request was rejected."),
      relatedId: approval.resource_id,
      relatedType: approval.resource_type
    };

    await withTransaction(async (tx) => {
      const run = (text, params) => tx.query(text, params);

      if (approval.resource_type === "user_account") {
        // Activate/deactivate account via is_approved
        await run("UPDATE users SET is_approved = $1, updated_at = NOW() WHERE id = $2", [
          resourceStatus, // true or false
          approval.resource_id
        ]);
      } else {
        // Update status of match/news
        const updateFields = [`status = $1`];
        const updateValues = [resourceStatus, approval.resource_id];
        let fieldIdx = 3;

        // If published immediately (no schedule) → set published_at = NOW()
        if (isApprove && !approval.scheduled_publish_at) {
          updateFields.push(`published_at = NOW()`);
        }

        await run(
          `UPDATE ${config.table} SET ${updateFields.join(", ")} WHERE id = $2`,
          updateValues
        );
      }

      // Update the approval record
      await run(
        `UPDATE approvals
         SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
         WHERE id = $4`,
        [approvalStatus, reason || null, adminId, approvalId]
      );
    });

    // Send notification after transaction commits
    await notificationsService.createNotification(notificationPayload);

    return { id: approvalId, status: approvalStatus, resourceStatus };
  }
};
