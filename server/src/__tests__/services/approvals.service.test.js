import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Smoke tests for approvals.service logic.
 * Mocks DB to test branching logic without a real DB.
 */

// Mock dependencies before importing the service
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
  match: { table: "matches", approvedStatus: "approved", rejectedStatus: "rejected", approvedTitle: "Approved", rejectedTitle: "Rejected" },
  news: { table: "news", approvedStatus: "approved", rejectedStatus: "rejected", approvedTitle: "Approved", rejectedTitle: "Rejected" },
  user_account: { table: "users", approvedStatus: true, rejectedStatus: false, approvedTitle: "Approved", rejectedTitle: "Rejected" }
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

  it("throws error if approval does not exist", async () => {
    query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(
      approvalsService.processApproval({ approvalId: 999, action: "approve", adminId: 1 })
    ).rejects.toThrow("Approval not found.");
  });

  it("throws error if approval has already been processed (status != pending)", async () => {
    query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [makeApproval({ status: "approved" })]
    });

    await expect(
      approvalsService.processApproval({ approvalId: 1, action: "approve", adminId: 1 })
    ).rejects.toThrow("has already been processed");
  });

  it("news without schedule → publish immediately (status=published)", async () => {
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

    // Check UPDATE news SET status = 'published'
    const newsUpdateCall = txQuery.mock.calls.find((call) =>
      call[0]?.includes("UPDATE news") && call[1]?.includes("published")
    );
    expect(newsUpdateCall).toBeDefined();
  });

  it("news with schedule → status=approved (cron will publish later)", async () => {
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

    // Check UPDATE users SET is_approved = true
    const userUpdateCall = txQuery.mock.calls.find((call) =>
      call[0]?.includes("UPDATE users") && call[1]?.[0] === true
    );
    expect(userUpdateCall).toBeDefined();
  });

  it("reject → resourceStatus = rejected + send notification", async () => {
    const approval = makeApproval({ resource_type: "match" });
    query.mockResolvedValueOnce({ rowCount: 1, rows: [approval] });

    const txQuery = vi.fn().mockResolvedValue({ rowCount: 1 });
    withTransaction.mockImplementationOnce(async (handler) => handler({ query: txQuery }));

    const result = await approvalsService.processApproval({
      approvalId: 1,
      action: "reject",
      reason: "Inappropriate content",
      adminId: 1
    });

    expect(result.status).toBe("rejected");
    expect(result.resourceStatus).toBe("rejected");
    expect(notificationsService.createNotification).toHaveBeenCalledOnce();
  });
});
