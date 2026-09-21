import { describe, expect, it } from "vitest";

import {
  buildOAuthCallbackUrl,
  getAppOrigin,
  getSafeNext,
} from "../lib/auth-redirect";

describe("OAuth redirect helpers", () => {
  it("builds an encoded callback URL for the selected role", () => {
    expect(buildOAuthCallbackUrl("https://care-companion-xi.vercel.app", "customer")).toBe(
      "https://care-companion-xi.vercel.app/auth/callback?next=%2Fchoose-role%3Frole%3Dcustomer",
    );
  });

  it("allows local paths but rejects external and protocol-relative redirects", () => {
    expect(getSafeNext("/customer/requests")).toBe("/customer/requests");
    expect(getSafeNext("https://attacker.example")).toBe("/choose-role");
    expect(getSafeNext("//attacker.example")).toBe("/choose-role");
    expect(getSafeNext("/\\attacker.example")).toBe("/choose-role");
  });

  it("uses the forwarded production host but keeps the local development origin", () => {
    expect(
      getAppOrigin("https://care-companion-xi.vercel.app/auth/callback", "care.example.com", false),
    ).toBe("https://care.example.com");
    expect(
      getAppOrigin("http://localhost:3000/auth/callback", "care.example.com", true),
    ).toBe("http://localhost:3000");
  });

  it("ignores malformed forwarded hosts", () => {
    expect(
      getAppOrigin("https://care.example.com/auth/callback", "evil.com/path", false),
    ).toBe("https://care.example.com");
  });
});
