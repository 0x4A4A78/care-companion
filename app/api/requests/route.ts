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
  const { data, error } = await supabase
    .from("service_requests")
    .insert(toServiceRequestInsert(parsed.data, user.id))
    .select("id, reference_no, status")
    .single();
  if (error) {
    console.error("Supabase insert service_requests error:", error);
    let message = "ไม่สามารถบันทึกคำขอได้";
    if (error.code === "23514") {
      message = "สถานที่ต้นทางและปลายทางต้องมีความยาวอย่างน้อย 8 ตัวอักษรตามเงื่อนไขฐานข้อมูล (กรุณารันคำสั่งอัปเดต SQL ใน Supabase เพื่อรองรับความยาว 3 ตัวอักษรขึ้นไป)";
    } else if (error.message) {
      message = `${message}: ${error.message}`;
    }
    return NextResponse.json({ error: message, details: error.details, code: error.code }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
