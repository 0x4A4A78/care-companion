import { NextResponse } from "next/server";
import { toServiceRequestInsert } from "../../../lib/data/mappers";
import { serviceRequestSchema } from "../../../lib/request-schema";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const parsed = serviceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Supabase", code: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== "customer" || profile.is_active === false) {
    return NextResponse.json({ error: "เฉพาะ Customer ที่เปิดใช้งานเท่านั้นที่สร้างคำขอได้" }, { status: 403 });
  }
  const { data, error } = await supabase
    .from("service_requests")
    .insert(toServiceRequestInsert(parsed.data, user.id))
    .select("id, reference_no, status")
    .single();
  if (error) {
    console.error("Supabase insert service_requests error:", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกคำขอได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
  return NextResponse.json({ data }, { status: 201 });
}
