import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, cancellationReason } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Find the request by id or reference_no
    let query = supabase.from("service_requests").select("*");
    if (id.startsWith("CC-")) {
      query = query.eq("reference_no", id);
    } else {
      query = query.or(`id.eq.${id},reference_no.eq.${id}`);
    }
    const { data: serviceReq, error: reqError } = await query.maybeSingle();
    if (reqError || !serviceReq) {
      return NextResponse.json({ error: "ไม่พบข้อมูลคำขอนี้" }, { status: 404 });
    }

    if (action === "accept") {
      if (role !== "companion" && role !== "admin") {
        return NextResponse.json({ error: "เฉพาะ Companion หรือ Admin เท่านั้นที่สามารถตอบรับงานได้" }, { status: 403 });
      }
      if (serviceReq.status !== "requested") {
        return NextResponse.json({ error: "คำขอนี้ไม่อยู่ในสถานะที่ตอบรับได้" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          companion_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceReq.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "ไม่สามารถตอบรับงานได้: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === "cancel") {
      const isOwner = serviceReq.customer_id === user.id || serviceReq.companion_id === user.id;
      if (!isOwner && role !== "admin") {
        return NextResponse.json({ error: "ไม่มีสิทธิ์ยกเลิกคำขอนี้" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason ?? "ยกเลิกโดยผู้ใช้",
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceReq.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "ไม่สามารถยกเลิกงานได้: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === "start") {
      if (serviceReq.companion_id !== user.id && role !== "admin") {
        return NextResponse.json({ error: "ไม่มีสิทธิ์เริ่มงานนี้" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status: "in_service",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceReq.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "ไม่สามารถเปลี่ยนสถานะได้: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === "complete") {
      if (serviceReq.companion_id !== user.id && role !== "admin") {
        return NextResponse.json({ error: "ไม่มีสิทธิ์จบงานนี้" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceReq.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "ไม่สามารถจบงานได้: " + error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "การกระทำไม่ถูกต้อง" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
