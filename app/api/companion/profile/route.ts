import { NextResponse } from "next/server";

import { companionProfileSchema } from "../../../../lib/companion-profile-schema";
import { createClient } from "../../../../lib/supabase/server";

export async function PUT(request: Request) {
  const parsed = companionProfileSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลโปรไฟล์ไม่ถูกต้อง", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("Companion profile role lookup failed:", {
      code: roleError.code,
      message: roleError.message,
    });
    return NextResponse.json({ error: "ไม่สามารถตรวจสอบบัญชีได้" }, { status: 500 });
  }
  if (!profile || profile.role !== "companion") {
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์แก้ไขโปรไฟล์ผู้ช่วย" }, { status: 403 });
  }

  const input = parsed.data;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      service_area: input.serviceArea || null,
      bio: input.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Companion profile update failed:", {
      code: profileError.code,
      message: profileError.message,
    });
    return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลส่วนตัวได้" }, { status: 500 });
  }

  const { data: detail, error: detailError } = await supabase
    .from("companion_details")
    .upsert({
      profile_id: user.id,
      experience_years: input.experienceYears,
      skills: input.skills,
      languages: input.languages,
      hourly_rate: input.hourlyRate,
      transportation: input.transportation || null,
      available: input.available,
    }, { onConflict: "profile_id" })
    .select("profile_id, available")
    .single();

  if (detailError) {
    console.error("Companion details upsert failed:", {
      code: detailError.code,
      message: detailError.message,
    });
    return NextResponse.json({ error: "ไม่สามารถบันทึกรายละเอียดผู้ช่วยได้" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: detail });
}
