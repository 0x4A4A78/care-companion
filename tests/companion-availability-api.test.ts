import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { PATCH } from "../app/api/companion/availability/route";

const userId = "11111111-1111-1111-1111-111111111111";

function request(available: boolean) {
  return new Request("http://localhost/api/companion/availability", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ available }),
  });
}

function createSupabaseMock(options: { existingDetail?: boolean; role?: string } = {}) {
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => ({
        data: { profile_id: userId, available: true },
        error: null,
      })),
    })),
  }));

  return {
    insert,
    client: {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: userId } } })),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { role: options.role ?? "companion" },
                  error: null,
                })),
              })),
            })),
          };
        }

        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: options.existingDetail
                    ? { profile_id: userId, available: true }
                    : null,
                  error: null,
                })),
                single: vi.fn(async () => ({
                  data: null,
                  error: {
                    code: "PGRST116",
                    message: "Cannot coerce the result to a single JSON object",
                  },
                })),
              })),
            })),
          })),
          insert,
        };
      }),
    },
  };
}

describe("PATCH /api/companion/availability", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("creates companion details when a new companion has no row yet", async () => {
    const supabase = createSupabaseMock();
    createClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(request(true));

    expect(response.status).toBe(200);
    expect(supabase.insert).toHaveBeenCalledWith({
      profile_id: userId,
      hourly_rate: 300,
      available: true,
    });
  });

  it("updates an existing companion row without inserting another row", async () => {
    const supabase = createSupabaseMock({ existingDetail: true });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(request(true));

    expect(response.status).toBe(200);
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("does not allow a customer to create companion details", async () => {
    const supabase = createSupabaseMock({ role: "customer" });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await PATCH(request(true));

    expect(response.status).toBe(403);
  });
});
