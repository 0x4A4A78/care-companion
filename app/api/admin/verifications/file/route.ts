import { NextResponse } from "next/server";

import { createClient } from "../../../../../lib/supabase/server";

export async function GET(request: Request) {
  const documentId = new URL(request.url).searchParams.get("id");
  if (!documentId) return NextResponse.json({ error: "ไม่พบรหัสเอกสาร" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { data: actor } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (!actor || actor.role !== "admin" || actor.is_active === false) {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  const { data: document } = await supabase
    .from("verification_documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!document) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(document.storage_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "เปิดเอกสารไม่สำเร็จ" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
