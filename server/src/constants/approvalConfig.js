export const APPROVAL_RESOURCE_MAP = {
  match: {
    table: "matches",
    approvedStatus: "approved",
    rejectedStatus: "rejected",
    approvedTitle: "Trận đấu đã được duyệt",
    rejectedTitle: "Trận đấu bị từ chối"
  },
  news: {
    table: "news",
    approvedStatus: "approved",
    rejectedStatus: "rejected",
    approvedTitle: "Tin tức đã được duyệt",
    rejectedTitle: "Tin tức bị từ chối"
  },
  user_account: {
    table: "users",
    approvedStatus: true,
    rejectedStatus: false,
    approvedTitle: "Tài khoản đã được duyệt",
    rejectedTitle: "Tài khoản bị từ chối"
  }
};
