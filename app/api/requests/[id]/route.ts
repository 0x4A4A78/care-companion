import { NextResponse } from "next/server";

import { canPerformRequestAction, type RequestAction, type RequestActorRole } from "../../../../lib/request-actions";
import type { ServiceStatus } from "../../../../lib/service-status";
import { createClient } from "../../../../lib/supabase/server";

const actions: RequestAction[] = ["accept", "cancel", "start", "complete"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action as RequestAction;
    if (!actions.includes(action)) return NextResponse.json({ error: "การกระทำไม่ถูกต้อง" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, verification_status, is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile || profile.is_active === false || !["customer", "companion", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่พบสิทธิ์ผู้ใช้งาน" }, { status: 403 });
    }

    if (action === "accept") {
      if (profile.role !== "companion") {
        return NextResponse.json({ error: "เฉพาะ Companion เท่านั้นที่รับงานได้" }, { status: 403 });
      }
      if (profile.verification_status !== "approved") {
        return NextResponse.json(
          { error: "คุณต้องได้รับการอนุมัติตัวตนจากผู้ดูแลระบบก่อน จึงจะสามารถรับงานได้" },
          { status: 403 },
        );
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json({ error: "รหัสคำขอไม่ถูกต้อง" }, { status: 400 });
      }

      const { data: acceptedRows, error: acceptError } = await supabase.rpc(
        "accept_open_request_for_companion",
        { target_request_id: id },
      );
      if (acceptError) {
        console.error("atomic request accept failed", { requestId: id, error: acceptError.code });
        return NextResponse.json(
          { error: acceptError.code === "PGRST202" || acceptError.code === "42883" ? "ฐานข้อมูลยังไม่ได้ติดตั้งระบบรับงาน กรุณารัน migration ล่าสุด" : "ไม่สามารถตอบรับงานได้ กรุณาลองใหม่" },
          { status: 500 },
        );
      }
      const accepted = Array.isArray(acceptedRows) ? acceptedRows[0] : acceptedRows;
      if (!accepted) {
        return NextResponse.json({ error: "งานนี้มีผู้ช่วยรับไปแล้ว หรือไม่อยู่ในสถานะที่รับได้" }, { status: 409 });
      }
      return NextResponse.json({ success: true, data: accepted });
    }

    let query = supabase.from("service_requests").select("*");
    query = id.startsWith("CC-") ? query.eq("reference_no", id) : query.eq("id", id);
    const { data: serviceReq, error: requestError } = await query.maybeSingle();
    if (requestError) console.error("request action lookup failed", { requestId: id, error: requestError.code });
    if (requestError || !serviceReq) return NextResponse.json({ error: "ไม่พบข้อมูลคำขอนี้" }, { status: 404 });

    const role = profile.role as RequestActorRole;
    const status = serviceReq.status as ServiceStatus;
    const allowed = canPerformRequestAction(
      action,
      status,
      role,
      serviceReq.companion_id === user.id,
      serviceReq.customer_id === user.id,
      Boolean(serviceReq.companion_id),
    );
    if (!allowed) return NextResponse.json({ error: "ไม่มีสิทธิ์ หรือสถานะงานไม่รองรับการทำรายการนี้" }, { status: 409 });

    const now = new Date().toISOString();
    const changes: Record<string, unknown> = { updated_at: now };
    if (action === "start") Object.assign(changes, { status: "in_service", started_at: now });
    if (action === "complete") Object.assign(changes, { status: "completed", completed_at: now });
    if (action === "cancel") Object.assign(changes, {
      status: "cancelled",
      cancelled_at: now,
      cancellation_reason: typeof body.cancellationReason === "string"
        ? body.cancellationReason.trim().slice(0, 500) || "ยกเลิกโดยผู้ใช้"
        : "ยกเลิกโดยผู้ใช้",
    });

    const update = supabase.from("service_requests").update(changes).eq("id", serviceReq.id).eq("status", status);
    const { data, error } = await update.select().maybeSingle();
    if (error) {
      console.error("request action update failed", { requestId: serviceReq.id, action, error: error.code });
      return NextResponse.json({ error: "ไม่สามารถเปลี่ยนสถานะงานได้ กรุณาลองใหม่" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "งานนี้ถูกผู้ใช้อื่นเปลี่ยนสถานะแล้ว กรุณาโหลดหน้าใหม่" }, { status: 409 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("request action failed", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
