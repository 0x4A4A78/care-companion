import { NextResponse } from "next/server";
import { createReviewSchema } from "../../../lib/review-schema";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = createReviewSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลการให้คะแนนไม่ถูกต้อง",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนให้คะแนน" }, { status: 401 });
    }

    const { requestId, rating, comment } = parsed.data;

    // ตรวจสอบว่างานนี้มีอยู่จริงและเป็นของลูกค้าท่านนี้
    const { data: serviceReq, error: reqError } = await supabase
      .from("service_requests")
      .select("id, customer_id, companion_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (reqError || !serviceReq) {
      return NextResponse.json({ error: "ไม่พบข้อมูลคำขอนี้" }, { status: 404 });
    }

    if (serviceReq.customer_id !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ให้คะแนนงานนี้" }, { status: 403 });
    }

    if (serviceReq.status !== "completed") {
      return NextResponse.json(
        { error: "สามารถให้คะแนนได้เฉพาะงานที่บริการเสร็จสิ้นแล้วเท่านั้น" },
        { status: 400 },
      );
    }

    if (!serviceReq.companion_id) {
      return NextResponse.json(
        { error: "งานนี้ไม่มีผู้ช่วยร่วมเดินทาง ไม่สามารถให้คะแนนได้" },
        { status: 400 },
      );
    }

    // บันทึกรีวิวลงฐานข้อมูล
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        request_id: serviceReq.id,
        customer_id: user.id,
        companion_id: serviceReq.companion_id,
        rating,
        comment: comment || null,
      })
      .select("id, request_id, rating, comment, created_at")
      .single();

    if (insertError) {
      // ตรวจสอบกรณีเคยให้คะแนนไปแล้ว (Unique constraint on request_id)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "คุณได้ให้คะแนนงานนี้ไปแล้ว" },
          { status: 409 },
        );
      }
      console.error("Review insert error:", insertError);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกคะแนนได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    const companionId = searchParams.get("companionId");

    const supabase = await createClient();

    let query = supabase
      .from("reviews")
      .select("id, request_id, customer_id, companion_id, rating, comment, created_at");

    if (requestId) {
      query = query.eq("request_id", requestId);
    }
    if (companionId) {
      query = query.eq("companion_id", companionId);
    }

    const { data: reviews, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Reviews GET error:", error);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรีวิวได้" }, { status: 500 });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
