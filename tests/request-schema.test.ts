import { describe, expect, it } from "vitest";

import { serviceRequestSchema } from "../lib/request-schema";

const validRequest = {
  category: "hospital",
  serviceDate: "2030-09-24",
  startTime: "09:00",
  durationHours: 3,
  pickup: "บ้านเลขที่ 99 ถนนสุขุมวิท กรุงเทพฯ",
  destination: "โรงพยาบาลศิริราช กรุงเทพฯ",
  supportNeeds: ["เดินเป็นเพื่อน", "ช่วยถือของชิ้นเล็ก"],
  notes: "เดินช้า กรุณามาถึงก่อนเวลานัด 15 นาที",
};

describe("service request validation", () => {
  it("accepts a complete request", () => {
    expect(serviceRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects identical pickup and destination", () => {
    const result = serviceRequestSchema.safeParse({
      ...validRequest,
      destination: validRequest.pickup,
    });
    expect(result.success).toBe(false);
  });

  it("requires a realistic service duration", () => {
    expect(
      serviceRequestSchema.safeParse({ ...validRequest, durationHours: 0.25 })
        .success,
    ).toBe(false);
    expect(
      serviceRequestSchema.safeParse({ ...validRequest, durationHours: 13 })
        .success,
    ).toBe(false);
  });

  it("limits free-text notes", () => {
    expect(
      serviceRequestSchema.safeParse({ ...validRequest, notes: "ก".repeat(1001) })
        .success,
    ).toBe(false);
  });

  it("rejects a service date in the past", () => {
    expect(serviceRequestSchema.safeParse({ ...validRequest, serviceDate: "2020-01-01" }).success).toBe(false);
  });

  it("accepts pickup and destination with at least 3 characters", () => {
    expect(
      serviceRequestSchema.safeParse({
        ...validRequest,
        pickup: "dDzxc",
        destination: "zxczxczxc",
      }).success,
    ).toBe(true);

    expect(
      serviceRequestSchema.safeParse({
        ...validRequest,
        pickup: "ab",
      }).success,
    ).toBe(false);
  });
});
