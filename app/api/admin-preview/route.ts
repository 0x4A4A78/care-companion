import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ADMIN_PREVIEW_COOKIE,
  getAdminPreviewCode,
  isAdminPreviewAvailable,
} from "../../../lib/auth/admin-preview";

const previewInputSchema = z.object({
  code: z.string().trim().min(1).max(64),
});

function matchesPreviewCode(candidate: string) {
  const expected = Buffer.from(getAdminPreviewCode());
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!isAdminPreviewAvailable()) {
    return NextResponse.json({ error: "ไม่พบโหมดตัวอย่าง" }, { status: 404 });
  }

  const parsed = previewInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !matchesPreviewCode(parsed.data.code)) {
    return NextResponse.json({ error: "รหัสสำหรับดูตัวอย่างไม่ถูกต้อง" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_PREVIEW_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_PREVIEW_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
