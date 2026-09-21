import { describe, expect, it } from "vitest";
import { GET, POST } from "../app/api/tts/route";
import { NextRequest } from "next/server";

describe("TTS API Route (/api/tts)", () => {
  it("rejects GET request without text query param", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("rejects POST request without text in body", async () => {
    const req = new NextRequest("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
