import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Smoke tests cho approvals.service logic.
 * Mock DB để test branching logic mà không cần DB thật.
 */

// Mock dependencies trước khi import service
vi.mock("../../../src/config/db.js", () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (handler) => {
    const mockClient = { query: vi.fn() };
    return handler(mockClient);
  })
}));

vi.mock("../../../src/modules/notifications/notifications.service.js", () => ({
  notificationsService: {
    createNotification: vi.fn()
  }
}));

const { query, withTransaction } = await import("../../../src/config/db.js");
const { notificationsService } = await import("../../../src/modules/notifications/notifications.service.js");
const { approvalsService } = await import("../../../src/modules/approvals/approvals.service.js");

const APPROVAL_RESOURCE_MAP = {
  match: { table: "matches", approvedStatus: "approved", rejectedStatus: "rejected", approvedTitle: "✅", rejectedTitle: "❌" },
  news: { table: "news", approvedStatus: "approved", rejectedStatus: "rejected", approvedTitle: "✅", rejectedTitle: "❌" },
  user_account: { table: "users", approvedStatus: true, rejectedStatus: false, approvedTitle: "✅", rejectedTitle: "❌" }
};

const makeApproval = (overrides = {}) => ({
  id: 1,
  resource_type: "news",
  resource_id: 42,
  submitted_by: 99,
  status: "pending",
  scheduled_publish_at: null,
  ...overrides
});

describe("approvalsService.processApproval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationsService.createNotification.mockResolvedValue({});
  });

  it("ném lỗi nếu approval không tồn tại", async () => {
    query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(
      approvalsService.processApproval({ approvalId: 999, action: "approve", adminId: 1 })
    ).rejects.toThrow("Approval không tồn tại.");
  });

  it("ném lỗi nếu approval đã được xử lý (status != pending)", async () => {
    query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [makeApproval({ status: "approved" })]
    });

    await expect(
      approvalsService.processApproval({ approvalId: 1, action: "approve", adminId: 1 })
    ).rejects.toThrow("đã được xử lý");
  });

  it("news không có schedule → publish ngay (status=published)", async () => {
    const approval = makeApproval({ resource_type: "news", scheduled_publish_at: null });
    query.mockResolvedValueOnce({ rowCount: 1, rows: [approval] });

    const txQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    withTransaction.mockImplementationOnce(async (handler) => {
      return handler({ query: txQuery });
    });

    const result = await approvalsService.processApproval({
      approvalId: 1,
      action: "approve",
      adminId: 1
    });

    expect(result.resourceStatus).toBe("published");

    // Kiểm tra UPDATE news SET status = 'published'
    const newsUpdateCall = txQuery.mock.calls.find((call) =>
      call[0]?.includes("UPDATE news") && call[1]?.includes("published")
    );
    expect(newsUpdateCall).toBeDefined();
  });

  it("news có schedule → status=approved (cron sẽ publish sau)", async () => {
    const approval = makeApproval({
      resource_type: "news",
      scheduled_publish_at: new Date(Date.now() + 3600000).toISOString()
    });
    query.mockResolvedValueOnce({ rowCount: 1, rows: [approval] });

    const txQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    withTransaction.mockImplementationOnce(async (handler) => handler({ query: txQuery }));

    const result = await approvalsService.processApproval({
      approvalId: 1,
      action: "approve",
      adminId: 1
    });

    expect(result.resourceStatus).toBe("approved");
  });

  it("user_account approve → resourceStatus = true (is_approved=true)", async () => {
    const approval = makeApproval({ resource_type: "user_account", resource_id: 10 });
    query.mockResolvedValueOnce({ rowCount: 1, rows: [approval] });

    const txQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    withTransaction.mockImplementationOnce(async (handler) => handler({ query: txQuery }));

    const result = await approvalsService.processApproval({
      approvalId: 1,
      action: "approve",
      adminId: 1
    });

    expect(result.resourceStatus).toBe(true);

    // Kiểm tra UPDATE users SET is_approved = true
    const userUpdateCall = txQuery.mock.calls.find((call) =>
      call[0]?.includes("UPDATE users") && call[1]?.[0] === true
    );
    expect(userUpdateCall).toBeDefined();
  });

  it("reject → resourceStatus = rejected + gửi notification", async () => {
    const approval = makeApproval({ resource_type: "match" });
    query.mockResolvedValueOnce({ rowCount: 1, rows: [approval] });

    const txQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    withTransaction.mockImplementationOnce(async (handler) => handler({ query: txQuery }));

    const result = await approvalsService.processApproval({
      approvalId: 1,
      action: "reject",
      reason: "Nội dung không phù hợp",
      adminId: 1
    });

    expect(result.status).toBe("rejected");
    expect(result.resourceStatus).toBe("rejected");
    expect(notificationsService.createNotification).toHaveBeenCalledOnce();
  });
});
