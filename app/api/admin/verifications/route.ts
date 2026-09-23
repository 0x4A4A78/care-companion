import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.companionId || !body.status) {
      return NextResponse.json({ error: "ต้องระบุ companionId และ status" }, { status: 400 });
    }

    const { companionId, status, note } = body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Update profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", companionId)
      .select("id, full_name, verification_status")
      .single();

    if (profileError) {
      console.error("Verification profile update error:", profileError);
      return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะการตรวจสอบได้" }, { status: 500 });
    }

    // 2. Also update verification_documents if any exist
    await supabase
      .from("verification_documents")
      .update({
        status,
        review_note: note || (status === "approved" ? "อนุมัติโดยผู้ดูแลระบบ" : "ปฏิเสธโดยผู้ดูแลระบบ"),
      })
      .eq("companion_id", companionId);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Admin verifications PATCH error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
