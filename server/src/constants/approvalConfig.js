/**
 * Configuration for each resource type in the approval flow.
 * Add new types here instead of modifying approvals.service.js (DRY principle).
 *
 * approvedStatus:
 *   - match/news: 'approved' (if has scheduled_publish_at, cron will set 'published')
 *   - user_account: true (boolean — set is_approved = true)
 *
 * rejectedStatus:
 *   - match/news: 'rejected'
 *   - user_account: false (boolean — set is_approved = false, keep current state)
 */
export const APPROVAL_RESOURCE_MAP = {
  match: {
    table: "matches",
    approvedStatus: "approved",
    rejectedStatus: "rejected",
    approvedTitle: "Your match has been approved",
    rejectedTitle: "Your match has been rejected"
  },

  user_account: {
    table: "users",
    approvedStatus: true,   // is_approved = true
    rejectedStatus: false,  // is_approved = false
    approvedTitle: "Your account has been activated",
    rejectedTitle: "Your account has been rejected"
  }
};
