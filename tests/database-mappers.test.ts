import { describe, expect, it } from "vitest";

import { toServiceRequestInsert } from "../lib/data/mappers";
import { formatThaiDate, serviceCategoryLabel } from "../lib/data/presentation";

describe("Supabase data mappers", () => {
  it("maps validated request input to PostgreSQL snake_case columns", () => {
    expect(toServiceRequestInsert({
      category: "hospital",
      serviceDate: "2026-09-24",
      startTime: "09:00",
      durationHours: 3,
      pickup: "99 ถนนสุขุมวิท กรุงเทพฯ",
      pickupLatitude: 13.7563,
      pickupLongitude: 100.5018,
      pickupAccuracyMeters: 20,
      destination: "โรงพยาบาลศิริราช กรุงเทพฯ",
      supportNeeds: ["เดินเป็นเพื่อน"],
      notes: "มาถึงก่อนเวลานัด",
    }, "customer-id")).toEqual({
      category: "hospital",
      service_date: "2026-09-24",
      start_time: "09:00",
      duration_hours: 3,
      pickup: "99 ถนนสุขุมวิท กรุงเทพฯ",
      pickup_latitude: 13.7563,
      pickup_longitude: 100.5018,
      pickup_accuracy_meters: 20,
      destination: "โรงพยาบาลศิริราช กรุงเทพฯ",
      support_needs: ["เดินเป็นเพื่อน"],
      notes: "มาถึงก่อนเวลานัด",
      customer_id: "customer-id",
    });
  });
});

describe("database presentation helpers", () => {
  it("uses Thai labels for persisted categories", () => {
    expect(serviceCategoryLabel.hospital).toBe("ไปพบแพทย์ / โรงพยาบาล");
    expect(serviceCategoryLabel.other).toBe("ธุระอื่น ๆ");
  });

  it("formats ISO dates using the Thai locale", () => {
    expect(formatThaiDate("2026-09-24")).toContain("24");
  });
});
