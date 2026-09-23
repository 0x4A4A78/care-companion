import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { PATCH as patchUser } from "../app/api/admin/users/route";
import { PATCH as patchVerification } from "../app/api/admin/verifications/route";

describe("Admin Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when userId is missing", async () => {
    const req = new Request("http://localhost/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });

    const res = await patchUser(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("ต้องระบุ userId");
  });

  it("returns 400 when no valid update fields are provided", async () => {
    const req = new Request("http://localhost/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "u-123", invalidField: "test" }),
    });

    const res = await patchUser(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("ไม่มีข้อมูลที่ต้องอัปเดต");
  });

  it("updates user role and active status successfully", async () => {
    const mockSingle = vi.fn(async () => ({
      data: {
        id: "u-123",
        full_name: "สมศักดิ์ ดูแล",
        role: "companion",
        verification_status: "approved",
        is_active: true,
      },
      error: null,
    }));

    const mockSelect = vi.fn(() => ({ single: mockSingle }));
    const mockEq = vi.fn(() => ({ select: mockSelect }));
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));

    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ update: mockUpdate })),
    });

    const req = new Request("http://localhost/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "u-123", role: "companion", isActive: true }),
    });

    const res = await patchUser(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe("companion");
    expect(mockUpdate).toHaveBeenCalledWith({ role: "companion", is_active: true });
  });
});

describe("Admin Verifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when companionId or status is missing", async () => {
    const req = new Request("http://localhost/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companionId: "c-123" }),
    });

    const res = await patchVerification(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("ต้องระบุ companionId และ status");
  });

  it("returns 400 when status is invalid", async () => {
    const req = new Request("http://localhost/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companionId: "c-123", status: "banned" }),
    });

    const res = await patchVerification(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("สถานะไม่ถูกต้อง");
  });

  it("approves companion verification successfully", async () => {
    const mockSingle = vi.fn(async () => ({
      data: {
        id: "c-123",
        full_name: "พยาบาลสมหญิง",
        verification_status: "approved",
      },
      error: null,
    }));

    const mockProfileSelect = vi.fn(() => ({ single: mockSingle }));
    const mockProfileEq = vi.fn(() => ({ select: mockProfileSelect }));
    const mockProfileUpdate = vi.fn(() => ({ eq: mockProfileEq }));

    const mockDocEq = vi.fn(async () => ({ error: null }));
    const mockDocUpdate = vi.fn(() => ({ eq: mockDocEq }));

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return { update: mockProfileUpdate };
        }
        return { update: mockDocUpdate };
      }),
    });

    const req = new Request("http://localhost/api/admin/verifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companionId: "c-123", status: "approved" }),
    });

    const res = await patchVerification(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.profile.verification_status).toBe("approved");
    expect(mockProfileUpdate).toHaveBeenCalledWith({ verification_status: "approved" });
    expect(mockDocUpdate).toHaveBeenCalledWith({
      status: "approved",
      review_note: "อนุมัติโดยผู้ดูแลระบบ",
    });
  });
});
