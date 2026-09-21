import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  try {
    const [{ data: profile }, { data: contact }, { data: trustedList }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, role, service_area, bio")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profile_contacts")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle(),
        supabase
          .from("trusted_contacts")
          .select("id, name, relationship, phone")
          .eq("customer_id", user.id)
          .limit(1),
      ]);

    if (!profile) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลโปรไฟล์" },
        { status: 404 },
      );
    }

    const trusted = trustedList?.[0] ?? null;

    let allergies = contact?.allergies ?? "";
    let chronicDiseases = contact?.chronic_diseases ?? "";
    let bloodType = contact?.blood_type ?? "";
    let mobilityAid = contact?.mobility_aid ?? "";
    let emergencyNote = contact?.emergency_note ?? "";

    // Parse JSON fallback if present
    if (
      emergencyNote &&
      emergencyNote.startsWith("{") &&
      emergencyNote.endsWith("}")
    ) {
      try {
        const parsed = JSON.parse(emergencyNote);
        allergies = allergies || parsed.allergies || "";
        chronicDiseases = chronicDiseases || parsed.chronicDiseases || "";
        bloodType = bloodType || parsed.bloodType || "";
        mobilityAid = mobilityAid || parsed.mobilityAid || "";
        emergencyNote = parsed.emergencyNote || "";
      } catch {
        // Keep plain text
      }
    }

    return NextResponse.json({
      data: {
        id: profile.id,
        fullName: profile.full_name,
        role: profile.role,
        serviceArea: profile.service_area ?? "",
        bio: profile.bio ?? "",
        phone: contact?.phone ?? "",
        allergies,
        chronicDiseases,
        bloodType,
        mobilityAid,
        emergencyNote,
        familyContact: trusted
          ? {
              id: trusted.id,
              name: trusted.name,
              relationship: trusted.relationship,
              phone: trusted.phone,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลโปรไฟล์ได้" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      fullName,
      serviceArea,
      bio,
      phone,
      allergies,
      chronicDiseases,
      bloodType,
      mobilityAid,
      emergencyNote,
      familyName,
      familyRelationship,
      familyPhone,
    } = body;

    // 1. Update profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName?.trim() || "ผู้ใช้บริการ",
        service_area: serviceArea?.trim() || null,
        bio: bio?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // 2. Update/Upsert trusted_contacts for family
    if (familyName?.trim() || familyPhone?.trim()) {
      const { data: existingContact } = await supabase
        .from("trusted_contacts")
        .select("id")
        .eq("customer_id", user.id)
        .limit(1)
        .maybeSingle();

      if (existingContact?.id) {
        await supabase
          .from("trusted_contacts")
          .update({
            name: familyName?.trim() || "ครอบครัว",
            relationship: familyRelationship?.trim() || "คนในครอบครัว",
            phone: familyPhone?.trim() || "",
          })
          .eq("id", existingContact.id);
      } else {
        await supabase.from("trusted_contacts").insert({
          customer_id: user.id,
          name: familyName?.trim() || "ครอบครัว",
          relationship: familyRelationship?.trim() || "คนในครอบครัว",
          phone: familyPhone?.trim() || "",
        });
      }
    }

    // 3. Upsert profile_contacts with health data
    const contactPayload = {
      profile_id: user.id,
      phone: phone?.trim() || null,
      allergies: allergies?.trim() || null,
      chronic_diseases: chronicDiseases?.trim() || null,
      blood_type: bloodType?.trim() || null,
      mobility_aid: mobilityAid?.trim() || null,
      emergency_note: emergencyNote?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error: contactError } = await supabase
      .from("profile_contacts")
      .upsert(contactPayload, { onConflict: "profile_id" });

    // Graceful fallback if new columns don't exist yet
    if (contactError && contactError.code === "42703") {
      const fallbackNote = JSON.stringify({
        allergies: allergies?.trim() || "",
        chronicDiseases: chronicDiseases?.trim() || "",
        bloodType: bloodType?.trim() || "",
        mobilityAid: mobilityAid?.trim() || "",
        emergencyNote: emergencyNote?.trim() || "",
      });

      await supabase.from("profile_contacts").upsert(
        {
          profile_id: user.id,
          phone: phone?.trim() || null,
          emergency_note: fallbackNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลโปรไฟล์และสุขภาพเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 },
    );
  }
}
