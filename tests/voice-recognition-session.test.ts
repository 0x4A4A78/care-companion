import { describe, expect, it } from "vitest";
import { getRecognitionEndAction } from "../lib/voice-recognition-session";

describe("getRecognitionEndAction", () => {
  it("processes a transcript after a natural end", () => {
    expect(getRecognitionEndAction("natural", "ไปโรงพยาบาล")).toBe("process");
  });

  it("reports no speech after a natural end with a blank transcript", () => {
    expect(getRecognitionEndAction("natural", "   ")).toBe("no-speech");
  });

  it("ignores onend after a recognition error", () => {
    expect(getRecognitionEndAction("error", "")).toBe("ignore");
  });

  it("ignores onend when the user switches to text input", () => {
    expect(getRecognitionEndAction("cancelled", "ข้อความบางส่วน")).toBe(
      "ignore",
    );
  });
});
