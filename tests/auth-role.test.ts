import { describe, expect, it } from "vitest";

import { canAccessPortalRole, getRoleHome } from "../lib/auth/roles";

describe("portal role authorization", () => {
  it.each([
    ["customer", "/customer"],
    ["companion", "/companion"],
    ["admin", "/admin"],
  ] as const)("sends %s users to their own dashboard", (role, expected) => {
    expect(getRoleHome(role)).toBe(expected);
  });

  it("only allows a user into the portal matching their stored role", () => {
    expect(canAccessPortalRole("customer", "customer")).toBe(true);
    expect(canAccessPortalRole("customer", "companion")).toBe(false);
    expect(canAccessPortalRole("customer", "admin")).toBe(false);
  });
});
