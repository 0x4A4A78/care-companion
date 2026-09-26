import { NextResponse } from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { validateVerificationDocument } from "../../../../lib/verification-document";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { data, error } = await supabase
    .from("verification_documents")
    .select("id, document_type, status, review_note, created_at")
    .eq("companion_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "ไม่สามารถโหลดเอกสารได้" }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== "companion" || profile.is_active === false) {
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์ส่งเอกสาร Companion" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const documentType = form?.get("documentType");
  const file = form?.get("file");
  if (typeof documentType !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "กรุณาเลือกประเภทและไฟล์เอกสาร" }, { status: 400 });
  }

  const validation = validateVerificationDocument(documentType, file);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const storagePath = `${user.id}/${crypto.randomUUID()}.${validation.extension}`;
  const { error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("verification upload failed", { code: uploadError.message });
    return NextResponse.json({ error: "อัปโหลดไฟล์ไม่สำเร็จ กรุณาตรวจสอบ Storage bucket" }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from("verification_documents")
    .insert({
      companion_id: user.id,
      document_type: documentType,
      storage_path: storagePath,
      status: "pending",
    })
    .select("id, document_type, status, review_note, created_at")
    .single();
  if (insertError) {
    await supabase.storage.from("verification-documents").remove([storagePath]);
    console.error("verification document record failed", { code: insertError.code });
    return NextResponse.json({ error: "บันทึกข้อมูลเอกสารไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
