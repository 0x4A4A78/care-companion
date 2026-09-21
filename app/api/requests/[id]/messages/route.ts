import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    let query = supabase.from("service_requests").select("id");
    if (id.startsWith("CC-")) {
      query = query.eq("reference_no", id);
    } else {
      query = query.or(`id.eq.${id},reference_no.eq.${id}`);
    }
    const { data: serviceReq } = await query.maybeSingle();
    if (!serviceReq) return NextResponse.json({ error: "ไม่พบงานนี้" }, { status: 404 });

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("request_id", serviceReq.id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const text = body.message?.trim();
    if (!text) return NextResponse.json({ error: "กรุณาใส่ข้อความ" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    let query = supabase.from("service_requests").select("id, customer_id, companion_id");
    if (id.startsWith("CC-")) {
      query = query.eq("reference_no", id);
    } else {
      query = query.or(`id.eq.${id},reference_no.eq.${id}`);
    }
    const { data: serviceReq } = await query.maybeSingle();
    if (!serviceReq) return NextResponse.json({ error: "ไม่พบงานนี้" }, { status: 404 });

    const isParticipant = serviceReq.customer_id === user.id || serviceReq.companion_id === user.id;
    if (!isParticipant) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ส่งข้อความในงานนี้" }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        request_id: serviceReq.id,
        sender_id: user.id,
        body: text,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
