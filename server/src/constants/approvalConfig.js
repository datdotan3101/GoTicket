/**
 * Cấu hình cho từng loại resource trong approval flow.
 * Thêm loại mới ở đây thay vì sửa approvals.service.js (DRY principle).
 *
 * approvedStatus:
 *   - match/news: 'approved' (nếu có scheduled_publish_at, cron sẽ set 'published')
 *   - user_account: true (boolean — set is_approved = true)
 *
 * rejectedStatus:
 *   - match/news: 'rejected'
 *   - user_account: false (boolean — set is_approved = false, giữ nguyên trạng thái)
 */
export const APPROVAL_RESOURCE_MAP = {
  match: {
    table: "matches",
    approvedStatus: "approved",
    rejectedStatus: "rejected",
    approvedTitle: "Trận đấu của bạn đã được duyệt ✅",
    rejectedTitle: "Trận đấu của bạn bị từ chối ❌"
  },
  news: {
    table: "news",
    approvedStatus: "approved",
    rejectedStatus: "rejected",
    approvedTitle: "Bài viết của bạn đã được duyệt ✅",
    rejectedTitle: "Bài viết của bạn bị từ chối ❌"
  },
  user_account: {
    table: "users",
    approvedStatus: true,   // is_approved = true
    rejectedStatus: false,  // is_approved = false
    approvedTitle: "Tài khoản của bạn đã được kích hoạt ✅",
    rejectedTitle: "Tài khoản của bạn bị từ chối ❌"
  }
};
