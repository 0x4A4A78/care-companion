import { describe, expect, it } from "vitest";

import {
  formatTime24HourInput,
  getConversationVoicePatch,
  isValidTime24Hour,
} from "../lib/request-conversation";

describe("request conversation voice answers", () => {
  it("understands a category answer", () => {
    expect(getConversationVoicePatch("category", "ไปโรงพยาบาล")).toEqual({ category: "hospital" });
  });

  it("keeps a spoken pickup location as entered", () => {
    expect(getConversationVoicePatch("pickup", "บ้านเลขที่ 99 ถนนสุขุมวิท")).toEqual({ pickup: "บ้านเลขที่ 99 ถนนสุขุมวิท" });
  });

  it("extracts a reasonable duration", () => {
    expect(getConversationVoicePatch("duration", "ประมาณ 4 ชั่วโมง")).toEqual({ durationHours: 4 });
    expect(getConversationVoicePatch("duration", "ทั้งวันเลย")).toEqual({});
  });
});

describe("Thai 24-hour time input", () => {
  it("formats four digits as HH:MM", () => {
    expect(formatTime24HourInput("2000")).toBe("20:00");
    expect(formatTime24HourInput("1300")).toBe("13:00");
  });

  it("keeps a valid colon-formatted value", () => {
    expect(formatTime24HourInput("09:30")).toBe("09:30");
  });

  it("rejects hours and minutes outside the 24-hour clock", () => {
    expect(isValidTime24Hour("20:00")).toBe(true);
    expect(isValidTime24Hour("24:00")).toBe(false);
    expect(isValidTime24Hour("13:60")).toBe(false);
  });
});
