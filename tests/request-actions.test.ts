import { describe, expect, it } from "vitest";

import { canPerformRequestAction } from "../lib/request-actions";

describe("canPerformRequestAction", () => {
  it("only lets companions accept an unassigned requested job", () => {
    expect(canPerformRequestAction("accept", "requested", "companion", false, false, false)).toBe(true);
    expect(canPerformRequestAction("accept", "accepted", "companion", false, false, false)).toBe(false);
    expect(canPerformRequestAction("accept", "requested", "customer", false, true, false)).toBe(false);
    expect(canPerformRequestAction("accept", "requested", "admin", false, false, false)).toBe(false);
  });

  it("lets only the assigned companion start and complete at valid states", () => {
    expect(canPerformRequestAction("start", "accepted", "companion", true, false, false)).toBe(true);
    expect(canPerformRequestAction("start", "requested", "companion", true, false, false)).toBe(false);
    expect(canPerformRequestAction("complete", "in_service", "companion", true, false, false)).toBe(true);
    expect(canPerformRequestAction("complete", "accepted", "companion", true, false, false)).toBe(false);
  });

  it("allows participants to cancel only active pre-service jobs", () => {
    expect(canPerformRequestAction("cancel", "requested", "customer", false, true, false)).toBe(true);
    expect(canPerformRequestAction("cancel", "accepted", "companion", true, false, false)).toBe(true);
    expect(canPerformRequestAction("cancel", "in_service", "customer", false, true, false)).toBe(false);
  });
});
