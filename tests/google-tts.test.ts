import { describe, expect, it } from "vitest";

import {
  buildGoogleTtsUrl,
  findPreferredThaiVoice,
} from "../lib/google-tts";

describe("Google Thai TTS", () => {
  it("builds a safe URL for the local Google TTS endpoint", () => {
    expect(buildGoogleTtsUrl(" สวัสดีครับ ")).toBe(
      "/api/tts?text=%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A",
    );
  });

  it("prefers an installed Google Thai voice", () => {
    const voices = [
      { name: "Microsoft Premwadee", lang: "th-TH" },
      { name: "Google ภาษาไทย", lang: "th-TH" },
      { name: "Google US English", lang: "en-US" },
    ];

    expect(findPreferredThaiVoice(voices)).toEqual(voices[1]);
  });

  it("falls back to another Thai voice when Google Thai is unavailable", () => {
    const voices = [
      { name: "English Voice", lang: "en-US" },
      { name: "Microsoft Premwadee", lang: "th-TH" },
    ];

    expect(findPreferredThaiVoice(voices)).toEqual(voices[1]);
  });
});
