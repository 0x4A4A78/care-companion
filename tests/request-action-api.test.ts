import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/supabase/server", () => ({ createClient: createClientMock }));

import { PATCH } from "../app/api/requests/[id]/route";

const companionId = "11111111-1111-4111-8111-111111111111";
const requestId = "64f12db7-67c5-4765-9051-7def7a2138b8";

describe("PATCH /api/requests/[id] accept", () => {
  beforeEach(() => createClientMock.mockReset());

  it("accepts through the atomic RPC without an RLS-blocked request lookup", async () => {
    const rpc = vi.fn(async () => ({
      data: [{ id: requestId, status: "accepted", companion_id: companionId }],
      error: null,
    }));
    const from = vi.fn((table: string) => {
      if (table !== "profiles") throw new Error("service_requests must not be read before accept RPC");
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { role: "companion" }, error: null })) })) })) };
    });
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: companionId } } })) },
      from,
      rpc,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      }),
      { params: Promise.resolve({ id: requestId }) },
    );

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("accept_open_request_for_companion", {
      target_request_id: requestId,
    });
  });
});
