import { NextResponse } from "next/server";
import { getAppOrigin, getSafeNext } from "../../../lib/auth-redirect";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getAppOrigin(request.url, request.headers.get("x-forwarded-host"));
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const requestedRole = new URL(next, origin).searchParams.get("role");
      const role = requestedRole === "companion" ? "companion" : "customer";
      if (user) {
        const { data: existing, error: profileReadError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (profileReadError) {
          return NextResponse.redirect(`${origin}/login?error=profile`);
        }
        if (!existing) {
          const { error: profileCreateError } = await supabase.from("profiles").insert({
            id: user.id,
            role,
            full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? "ผู้ใช้งานใหม่",
            avatar_path: user.user_metadata.avatar_url ?? null,
          });
          if (profileCreateError) {
            return NextResponse.redirect(`${origin}/login?error=profile`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
