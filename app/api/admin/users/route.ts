import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.userId) {
      return NextResponse.json({ error: "ต้องระบุ userId" }, { status: 400 });
    }

    const { userId, role, verificationStatus, isActive } = body;
    const updates: Record<string, unknown> = {};

    if (role && ["customer", "companion", "admin"].includes(role)) {
      updates.role = role;
    }
    if (verificationStatus && ["pending", "approved", "rejected"].includes(verificationStatus)) {
      updates.verification_status = verificationStatus;
    }
    if (typeof isActive === "boolean") {
      updates.is_active = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องอัปเดต" }, { status: 400 });
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
    if (userId === user.id && ((updates.role && updates.role !== "admin") || updates.is_active === false)) {
      return NextResponse.json({ error: "ผู้ดูแลระบบไม่สามารถลดสิทธิ์หรือระงับบัญชีตนเองได้" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("id, full_name, role, verification_status, is_active")
      .single();

    if (error) {
      console.error("Admin user update error:", error);
      return NextResponse.json({ error: "ไม่สามารถอัปเดตผู้ใช้ได้" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
