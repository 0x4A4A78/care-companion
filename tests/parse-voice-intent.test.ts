import { describe, expect, it } from "vitest";
import { parseVoiceIntent } from "../lib/parse-voice-intent";

describe("parseVoiceIntent", () => {
  const referenceDate = new Date("2026-09-27T03:00:00.000Z");

  it("parses hospital request with destination and time", () => {
    const result = parseVoiceIntent("อยากไปโรงพยาบาลศิริราชพรุ่งนี้ตอนเก้าโมง");
    expect(result.category).toBe("hospital");
    expect(result.destination).toBe("โรงพยาบาลศิริราช");
    expect(result.serviceDate).toBeDefined();
    expect(result.startTime).toBe("09:00");
  });

  it("parses bank request with support needs", () => {
    const result = parseVoiceIntent("ไปธนาคารกสิกรวันจันทร์บ่ายสองโมง ช่วยถือของด้วย");
    expect(result.category).toBe("bank");
    expect(result.destination).toBe("ธนาคารกสิกรไทย");
    expect(result.startTime).toBe("14:00");
    expect(result.supportNeeds).toContain("ช่วยถือของชิ้นเล็ก");
  });

  it("parses shopping request", () => {
    const result = parseVoiceIntent("อยากไปซื้อของที่ตลาด");
    expect(result.category).toBe("shopping");
    expect(result.destination).toBe("ตลาด");
  });

  it("parses government request", () => {
    const result = parseVoiceIntent("ต้องไปทำบัตรประชาชนที่สำนักงานเขต");
    expect(result.category).toBe("government");
  });

  it("returns 'other' category for unknown input", () => {
    const result = parseVoiceIntent("อยากไปทำธุระ");
    expect(result.category).toBe("other");
  });

  it("handles empty string", () => {
    const result = parseVoiceIntent("");
    expect(result.raw).toBe("");
    expect(result.category).toBeUndefined();
  });

  it("parses afternoon time correctly", () => {
    const result = parseVoiceIntent("ไปหมอบ่ายสามโมง");
    expect(result.category).toBe("hospital");
    expect(result.startTime).toBe("15:00");
  });

  it("parses multiple support needs", () => {
    const result = parseVoiceIntent("ไปโรงพยาบาลต้องใช้รถเข็นและรอคิวด้วย");
    expect(result.category).toBe("hospital");
    expect(result.supportNeeds).toContain("ช่วยใช้รถเข็น");
    expect(result.supportNeeds).toContain("รอเป็นเพื่อนจนเสร็จธุระ");
  });

  it.each([
    ["อีก 3 วัน 10 โมงเช้า", "2026-09-30", "10:00"],
    ["อีก 4 วัน 14:30", "2026-10-01", "14:30"],
    ["อีก 2 วัน บ่ายสอง", "2026-09-29", "14:00"],
    ["อีกสามวันสิบโมงครึ่ง", "2026-09-30", "10:30"],
    ["พรุ่งนี้ 9 โมงเช้า", "2026-09-28", "09:00"],
    ["วันที่ 28 10 โมงเช้า", "2026-09-28", "10:00"],
    ["วันที่ 25 บ่าย 3", "2026-10-25", "15:00"],
    ["อีก 2 วัน 6 โมงเย็น", "2026-09-29", "18:00"],
  ])("parses conversational Thai date and time: %s", (text, serviceDate, startTime) => {
    const result = parseVoiceIntent(text, referenceDate);
    expect(result.serviceDate).toBe(serviceDate);
    expect(result.startTime).toBe(startTime);
  });
});
