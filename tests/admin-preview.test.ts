import { afterEach, describe, expect, it } from "vitest";

import { DELETE, POST } from "../app/api/admin-preview/route";

describe("Admin preview access", () => {
  afterEach(() => {
    delete process.env.ADMIN_PREVIEW_CODE;
    delete process.env.ADMIN_PREVIEW_ENABLED;
  });

  it("accepts the public preview code and creates an HttpOnly cookie", async () => {
    process.env.ADMIN_PREVIEW_CODE = "test";
    const response = await POST(new Request("http://localhost/api/admin-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "test" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(response.headers.get("set-cookie")).toContain("care_admin_preview=1");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects an incorrect preview code without setting a cookie", async () => {
    process.env.ADMIN_PREVIEW_CODE = "test";
    const response = await POST(new Request("http://localhost/api/admin-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "wrong" }),
    }));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("can disable preview access through configuration", async () => {
    process.env.ADMIN_PREVIEW_ENABLED = "false";
    const response = await POST(new Request("http://localhost/api/admin-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "test" }),
    }));

    expect(response.status).toBe(404);
  });

  it("clears the preview cookie on exit", async () => {
    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("care_admin_preview=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
