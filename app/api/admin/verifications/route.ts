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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { data: actor, error: actorError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (actorError || !actor || actor.role !== "admin" || actor.is_active === false) {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
    }
    if (status === "approved") {
      const { count, error: documentError } = await supabase
        .from("verification_documents")
        .select("id", { count: "exact", head: true })
        .eq("companion_id", companionId);
      if (documentError) return NextResponse.json({ error: "ไม่สามารถตรวจสอบรายการเอกสารได้" }, { status: 500 });
      if (!count) return NextResponse.json({ error: "Companion ต้องส่งเอกสารก่อนอนุมัติ" }, { status: 400 });
    }

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
        reviewed_by: user.id,
        review_note: note || (status === "approved" ? "อนุมัติโดยผู้ดูแลระบบ" : "ปฏิเสธโดยผู้ดูแลระบบ"),
      })
      .eq("companion_id", companionId);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Admin verifications PATCH error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
