import { describe, expect, it } from "vitest";

import { validateVerificationDocument } from "../lib/verification-document";

describe("verification document validation", () => {
  it("accepts a supported PDF document", () => {
    const file = new File(["pdf"], "identity.pdf", { type: "application/pdf" });
    expect(validateVerificationDocument("id_card", file)).toEqual({
      ok: true,
      extension: "pdf",
    });
  });

  it("rejects unsupported document types and file formats", () => {
    const file = new File(["text"], "identity.txt", { type: "text/plain" });
    expect(validateVerificationDocument("unknown", file).ok).toBe(false);
    expect(validateVerificationDocument("id_card", file).ok).toBe(false);
  });

  it("rejects files larger than 5 MB", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    expect(validateVerificationDocument("criminal_record", file)).toEqual({
      ok: false,
      error: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB",
    });
  });
});
