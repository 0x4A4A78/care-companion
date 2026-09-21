import { describe, expect, it } from "vitest";

import {
  canTransitionService,
  getNextServiceStatus,
  serviceStatusLabel,
  type ServiceStatus,
} from "../lib/service-status";

describe("service status business rules", () => {
  it("allows the customer/companion happy path in order", () => {
    const path: ServiceStatus[] = [
      "requested",
      "accepted",
      "upcoming",
      "in_service",
      "completed",
    ];

    path.slice(0, -1).forEach((status, index) => {
      expect(canTransitionService(status, path[index + 1])).toBe(true);
    });
  });

  it("prevents skipping directly from requested to completed", () => {
    expect(canTransitionService("requested", "completed")).toBe(false);
    expect(getNextServiceStatus("requested")).toBe("accepted");
  });

  it("does not allow a completed or cancelled service to change", () => {
    expect(getNextServiceStatus("completed")).toBeNull();
    expect(getNextServiceStatus("cancelled")).toBeNull();
  });

  it("returns a plain Thai label for every status", () => {
    expect(serviceStatusLabel.requested).toBe("รอผู้ช่วยตอบรับ");
    expect(serviceStatusLabel.in_service).toBe("กำลังให้บริการ");
  });
});
