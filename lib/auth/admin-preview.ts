import { cookies } from "next/headers";

export const ADMIN_PREVIEW_COOKIE = "care_admin_preview";

export function isAdminPreviewAvailable() {
  return process.env.ADMIN_PREVIEW_ENABLED !== "false";
}

export function getAdminPreviewCode() {
  return process.env.ADMIN_PREVIEW_CODE?.trim() || "test";
}

export async function hasAdminPreviewSession() {
  if (!isAdminPreviewAvailable()) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_PREVIEW_COOKIE)?.value === "1";
}
