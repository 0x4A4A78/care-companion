import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { available } = body;
    if (typeof available !== "boolean") {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Companion availability profile lookup failed:", {
        code: profileError.code,
        message: profileError.message,
      });
      return NextResponse.json(
        { error: "ไม่สามารถตรวจสอบบัญชีผู้ช่วยได้" },
        { status: 500 },
      );
    }
    if (!profile || profile.role !== "companion") {
      return NextResponse.json(
        { error: "บัญชีนี้ไม่มีสิทธิ์เปลี่ยนสถานะผู้ช่วย" },
        { status: 403 },
      );
    }

    const { data: updatedDetail, error: updateError } = await supabase
      .from("companion_details")
      .update({ available })
      .eq("profile_id", user.id)
      .select("profile_id, available")
      .maybeSingle();

    if (updateError) {
      console.error("Companion availability update failed:", {
        code: updateError.code,
        message: updateError.message,
      });
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 },
      );
    }

    if (updatedDetail) {
      return NextResponse.json({ success: true, data: updatedDetail });
    }

    const { data: createdDetail, error: insertError } = await supabase
      .from("companion_details")
      .insert({
        profile_id: user.id,
        hourly_rate: 300,
        available,
      })
      .select("profile_id, available")
      .single();

    if (insertError) {
      console.error("Companion availability initialization failed:", {
        code: insertError.code,
        message: insertError.message,
      });
      return NextResponse.json(
        { error: "ไม่สามารถเริ่มต้นโปรไฟล์ผู้ช่วยได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: createdDetail });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
