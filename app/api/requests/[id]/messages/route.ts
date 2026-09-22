import { NextResponse } from "next/server";

import { createClient } from "../../../../../lib/supabase/server";

async function getAuthorizedRequest(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };

  let query = supabase.from("service_requests").select("id, customer_id, companion_id");
  query = id.startsWith("CC-") ? query.eq("reference_no", id) : query.eq("id", id);
  const { data: serviceReq, error } = await query.maybeSingle();
  if (error || !serviceReq) return { response: NextResponse.json({ error: "ไม่พบงานนี้" }, { status: 404 }) };

  const isParticipant = serviceReq.customer_id === user.id || serviceReq.companion_id === user.id;
  if (!isParticipant) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return { response: NextResponse.json({ error: "ไม่มีสิทธิ์อ่านข้อความของงานนี้" }, { status: 403 }) };
  }
  return { supabase, user, serviceReq };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthorizedRequest(id);
    if ("response" in auth) return auth.response;

    const { data: messages, error } = await auth.supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("request_id", auth.serviceReq.id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("messages lookup failed", { requestId: auth.serviceReq.id, error: error.code });
      return NextResponse.json({ error: "ไม่สามารถโหลดข้อความได้" }, { status: 500 });
    }
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("messages GET failed", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const text = typeof body.message === "string" ? body.message.trim() : "";
    if (!text) return NextResponse.json({ error: "กรุณาใส่ข้อความ" }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ error: "ข้อความยาวเกิน 2,000 ตัวอักษร" }, { status: 400 });

    const auth = await getAuthorizedRequest(id);
    if ("response" in auth) return auth.response;
    const { data: message, error } = await auth.supabase
      .from("messages")
      .insert({ request_id: auth.serviceReq.id, sender_id: auth.user.id, body: text })
      .select("id, sender_id, body, created_at")
      .single();
    if (error) {
      console.error("message insert failed", { requestId: auth.serviceReq.id, error: error.code });
      return NextResponse.json({ error: "ไม่สามารถส่งข้อความได้" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("messages POST failed", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
