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

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || !profile || !["customer", "companion", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่พบสิทธิ์ผู้ใช้งาน" }, { status: 403 });
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
    if (action === "accept") Object.assign(changes, { companion_id: user.id, status: "accepted", accepted_at: now });
    if (action === "start") Object.assign(changes, { status: "in_service", started_at: now });
    if (action === "complete") Object.assign(changes, { status: "completed", completed_at: now });
    if (action === "cancel") Object.assign(changes, {
      status: "cancelled",
      cancelled_at: now,
      cancellation_reason: typeof body.cancellationReason === "string"
        ? body.cancellationReason.trim().slice(0, 500) || "ยกเลิกโดยผู้ใช้"
        : "ยกเลิกโดยผู้ใช้",
    });

    let update = supabase.from("service_requests").update(changes).eq("id", serviceReq.id).eq("status", status);
    if (action === "accept") update = update.is("companion_id", null);
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
