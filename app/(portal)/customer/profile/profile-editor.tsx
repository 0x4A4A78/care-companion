"use client";

import {
  AlertTriangle,
  Check,
  Edit3,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomerProfileView } from "../../../../lib/data/queries";
import { Avatar, Badge, Card } from "../../../../components/ui";

const commonDiseases = [
  "เบาหวาน",
  "ความดันโลหิตสูง",
  "โรคหัวใจ",
  "โรคหอบหืด",
  "โรคไต",
  "ไขมันในเลือดสูง",
  "ข้อเข่าเสื่อม",
];

const commonAllergies = [
  "ยาเพนิซิลลิน (Penicillin)",
  "ยากลุ่มซัลฟา (Sulfa)",
  "ยาแก้ปวดกลุ่ม NSAIDs",
  "แอสไพริน (Aspirin)",
  "อาหารทะเล",
];

const mobilityOptions = [
  "เดินได้ปกติ",
  "เดินช้า / ต้องการคนช่วยพยุง",
  "ใช้ไม้เท้าช่วยพยุง",
  "ใช้รถเข็น (Wheelchair)",
];

const bloodTypes = ["ไม่ระบุ", "A", "B", "O", "AB"];

export function ProfileEditor({
  initialProfile,
}: {
  initialProfile: CustomerProfileView;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CustomerProfileView>(initialProfile);

  // Form state
  const [formData, setFormData] = useState({
    fullName: initialProfile.fullName,
    serviceArea: initialProfile.serviceArea,
    bio: initialProfile.bio,
    phone: initialProfile.phone,
    allergies: initialProfile.allergies,
    chronicDiseases: initialProfile.chronicDiseases,
    bloodType: initialProfile.bloodType || "ไม่ระบุ",
    mobilityAid: initialProfile.mobilityAid || "เดินได้ปกติ",
    emergencyNote: initialProfile.emergencyNote,
    familyName: initialProfile.familyContact?.name ?? "",
    familyRelationship: initialProfile.familyContact?.relationship ?? "บุตร/ธิดา",
    familyPhone: initialProfile.familyContact?.phone ?? "",
  });

  const handleAddDisease = (disease: string) => {
    const current = formData.chronicDiseases.trim();
    if (!current) {
      setFormData({ ...formData, chronicDiseases: disease });
    } else if (!current.includes(disease)) {
      setFormData({
        ...formData,
        chronicDiseases: `${current}, ${disease}`,
      });
    }
  };

  const handleAddAllergy = (allergy: string) => {
    const current = formData.allergies.trim();
    if (!current) {
      setFormData({ ...formData, allergies: allergy });
    } else if (!current.includes(allergy)) {
      setFormData({
        ...formData,
        allergies: `${current}, ${allergy}`,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setProfile({
        ...profile,
        fullName: formData.fullName,
        serviceArea: formData.serviceArea,
        bio: formData.bio,
        phone: formData.phone,
        allergies: formData.allergies,
        chronicDiseases: formData.chronicDiseases,
        bloodType: formData.bloodType,
        mobilityAid: formData.mobilityAid,
        emergencyNote: formData.emergencyNote,
        familyContact:
          formData.familyName || formData.familyPhone
            ? {
                name: formData.familyName,
                relationship: formData.familyRelationship,
                phone: formData.familyPhone,
              }
            : null,
      });

      setIsEditing(false);
      toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว", {
        description: "ข้อมูลสุขภาพและผู้ติดต่อจะถูกนำไปใช้อำนวยความสะดวกในการเดินทาง",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName,
      serviceArea: profile.serviceArea,
      bio: profile.bio,
      phone: profile.phone,
      allergies: profile.allergies,
      chronicDiseases: profile.chronicDiseases,
      bloodType: profile.bloodType || "ไม่ระบุ",
      mobilityAid: profile.mobilityAid || "เดินได้ปกติ",
      emergencyNote: profile.emergencyNote,
      familyName: profile.familyContact?.name ?? "",
      familyRelationship: profile.familyContact?.relationship ?? "บุตร/ธิดา",
      familyPhone: profile.familyContact?.phone ?? "",
    });
    setIsEditing(false);
  };

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* Action bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>โปรไฟล์และข้อมูลสุขภาพ</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
            ข้อมูลสำคัญเพื่อความปลอดภัยในการเดินทางและการติดต่อฉุกเฉิน
          </p>
        </div>
        {!isEditing ? (
          <button
            className="button button-primary"
            onClick={() => setIsEditing(true)}
            style={{ padding: "0 22px", minHeight: 46 }}
          >
            <Edit3 size={18} /> แก้ไขข้อมูลโปรไฟล์
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="button button-ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={18} /> ยกเลิก
            </button>
            <button
              className="button button-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minHeight: 46 }}
            >
              <Save size={18} /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* ───────────── EDIT MODE ───────────── */
        <form onSubmit={handleSave} className="stack" style={{ gap: 20 }}>
          {/* Card 1: Personal Info */}
          <Card className="form-card">
            <h2
              style={{
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 0,
              }}
            >
              <User size={20} color="var(--blue)" /> ข้อมูลส่วนตัว
            </h2>
            <div className="form-grid">
              <label className="field">
                <span>ชื่อ-นามสกุล *</span>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="เช่น คุณสมพร วัฒนะ"
                />
              </label>

              <label className="field">
                <span>เบอร์โทรศัพท์ของคุณ</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="เช่น 081-234-5678"
                />
              </label>

              <label className="field field-full">
                <span>พื้นที่พักอาศัย / ที่อยู่หลัก</span>
                <input
                  type="text"
                  value={formData.serviceArea}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceArea: e.target.value })
                  }
                  placeholder="เช่น ซอยเพชรเกษม 68 บางแค กรุงเทพฯ"
                />
                <small>ช่วยให้ผู้ช่วยในพื้นที่ใกล้เคียงเดินทางมารับได้สะดวก</small>
              </label>

              <label className="field field-full">
                <span>เกี่ยวกับตัวคุณ (ย่อ)</span>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="ข้อความแนะนำตัวเองสั้นๆ หรือสิ่งที่ต้องการบอกผู้ช่วย"
                />
              </label>
            </div>
          </Card>

          {/* Card 2: Health & Medical */}
          <Card className="form-card" style={{ borderColor: "#fecdd3" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 0,
                color: "#9f1239",
              }}
            >
              <HeartPulse size={20} color="#e11d48" /> ข้อมูลสุขภาพและความปลอดภัย
            </h2>
            <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: ".9rem" }}>
              ข้อมูลส่วนนี้จะช่วยให้ผู้ช่วยดูแลคุณได้อย่างถูกต้องและปลอดภัยตลอดการเดินทาง
            </p>

            <div className="stack" style={{ gap: 18 }}>
              {/* Allergies */}
              <div className="field">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldAlert size={16} color="var(--red)" />
                  <span style={{ fontWeight: 700 }}>ประวัติการแพ้ยา / แพ้อาหาร</span>
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) =>
                    setFormData({ ...formData, allergies: e.target.value })
                  }
                  placeholder="เช่น แพ้ยาเพนิซิลลิน (Penicillin), แพ้อาหารทะเล หรือระบุ 'ไม่มี'"
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  <small style={{ color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>
                    คลิกเพื่อเพิ่มด่วน:
                  </small>
                  {commonAllergies.map((allergy) => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => handleAddAllergy(allergy)}
                      style={{
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        borderRadius: 8,
                        padding: "3px 10px",
                        fontSize: ".78rem",
                        color: "#9f1239",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      + {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chronic Diseases */}
              <div className="field">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Heart size={16} color="var(--red)" />
                  <span style={{ fontWeight: 700 }}>โรคประจำตัว</span>
                </label>
                <input
                  type="text"
                  value={formData.chronicDiseases}
                  onChange={(e) =>
                    setFormData({ ...formData, chronicDiseases: e.target.value })
                  }
                  placeholder="เช่น เบาหวาน, ความดันโลหิตสูง, โรคหัวใจ หรือระบุ 'ไม่มี'"
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  <small style={{ color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>
                    คลิกเพื่อเพิ่มด่วน:
                  </small>
                  {commonDiseases.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleAddDisease(d)}
                      style={{
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 8,
                        padding: "3px 10px",
                        fontSize: ".78rem",
                        color: "#1d4ed8",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      + {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood Type & Mobility */}
              <div className="form-grid">
                <label className="field">
                  <span>กรุ๊ปเลือด</span>
                  <select
                    value={formData.bloodType}
                    onChange={(e) =>
                      setFormData({ ...formData, bloodType: e.target.value })
                    }
                  >
                    {bloodTypes.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt === "ไม่ระบุ" ? "ไม่ระบุ / ไม่ทราบ" : `กรุ๊ป ${bt}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>การเคลื่อนไหว / อุปกรณ์ช่วยเหลือ</span>
                  <select
                    value={formData.mobilityAid}
                    onChange={(e) =>
                      setFormData({ ...formData, mobilityAid: e.target.value })
                    }
                  >
                    {mobilityOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Emergency / Assistant Notes */}
              <label className="field">
                <span>ข้อควรระวังสำคัญสำหรับผู้ช่วย</span>
                <textarea
                  rows={2}
                  value={formData.emergencyNote}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyNote: e.target.value })
                  }
                  placeholder="เช่น เหนื่อยง่ายเวลาเดินขึ้นสะพานลอย, พกยาอมใต้ลิ้นไว้ในกระเป๋าเสื้อ, ดื่มน้ำทุก 1 ชั่วโมง"
                />
                <small>สิ่งที่ผู้ช่วยร่วมเดินทางควรระวังหรือคอยสังเกตอาการ</small>
              </label>
            </div>
          </Card>

          {/* Card 3: Family Contact */}
          <Card className="form-card" style={{ borderColor: "#bbf7d0" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 0,
                color: "#15803d",
              }}
            >
              <Users size={20} color="#16a34a" /> ข้อมูลครอบครัวและผู้ติดต่อฉุกเฉิน
            </h2>
            <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: ".9rem" }}>
              ผู้ช่วยหรือระบบสามารถติดต่อบุคคลนี้ได้ทันทีเมื่อเกิดเหตุจำเป็น
            </p>

            <div className="form-grid">
              <label className="field">
                <span>ชื่อคนในครอบครัว / ผู้ติดต่อ</span>
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) =>
                    setFormData({ ...formData, familyName: e.target.value })
                  }
                  placeholder="เช่น คุณนพดล (บุตรชาย)"
                />
              </label>

              <label className="field">
                <span>ความสัมพันธ์</span>
                <input
                  type="text"
                  value={formData.familyRelationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      familyRelationship: e.target.value,
                    })
                  }
                  placeholder="เช่น บุตร, หลาน, คู่สมรส, ผู้ดูแล"
                />
              </label>

              <label className="field field-full">
                <span>เบอร์โทรศัพท์ติดต่อครอบครัว *</span>
                <input
                  type="tel"
                  value={formData.familyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, familyPhone: e.target.value })
                  }
                  placeholder="เช่น 089-123-4567"
                />
                <small>เบอร์นี้จะแสดงในหน้าติดตามงานเพื่อให้ผู้ช่วยโทรติดต่อได้ทันที</small>
              </label>
            </div>
          </Card>

          {/* Save & Cancel */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
            <button
              type="button"
              className="button button-ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="button button-primary button-large"
              disabled={saving}
              style={{ minWidth: 200 }}
            >
              <Save size={20} /> {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลทั้งหมด"}
            </button>
          </div>
        </form>
      ) : (
        /* ───────────── VIEW MODE ───────────── */
        <div className="stack" style={{ gap: 20 }}>
          {/* Personal Card */}
          <Card className="form-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <Avatar name={profile.fullName} large tone="rose" />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{profile.fullName}</h2>
                  <Badge tone="blue">ผู้ใช้บริการ</Badge>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 8,
                    color: "var(--muted)",
                    fontSize: ".92rem",
                    flexWrap: "wrap",
                  }}
                >
                  {profile.phone && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={15} /> {profile.phone}
                    </span>
                  )}
                  {profile.serviceArea && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={15} /> {profile.serviceArea}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p style={{ margin: "10px 0 0", fontSize: ".92rem", color: "var(--navy)" }}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Health & Safety Highlights */}
          <div className="grid-main" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            <Card className="form-card" style={{ borderLeft: "4px solid #e11d48" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#9f1239",
                  }}
                >
                  <HeartPulse size={20} color="#e11d48" /> ข้อมูลสุขภาพและความปลอดภัย
                </h3>
                <Badge tone={profile.allergies ? "red" : "green"}>
                  {profile.allergies ? "มีข้อมูลแพ้ยา" : "ไม่มีประวัติแพ้ยา"}
                </Badge>
              </div>

              <div className="stack" style={{ gap: 14 }}>
                {/* Allergies Notice */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: profile.allergies ? "#fff1f2" : "#f0fdf4",
                    border: `1px solid ${profile.allergies ? "#fecdd3" : "#bbf7d0"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 700,
                      fontSize: ".88rem",
                      color: profile.allergies ? "#9f1239" : "#166534",
                      marginBottom: 4,
                    }}
                  >
                    {profile.allergies ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    ประวัติการแพ้ยา / แพ้อาหาร:
                  </div>
                  <strong
                    style={{
                      fontSize: ".95rem",
                      color: profile.allergies ? "#be123c" : "#15803d",
                    }}
                  >
                    {profile.allergies || "ไม่มีประวัติแพ้ยาหรืออาหาร"}
                  </strong>
                </div>

                {/* Chronic Diseases */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--muted)",
                      fontSize: ".85rem",
                      marginBottom: 4,
                    }}
                  >
                    <Heart size={15} color="var(--blue)" /> โรคประจำตัว:
                  </div>
                  <strong style={{ fontSize: ".95rem", color: "var(--navy)" }}>
                    {profile.chronicDiseases || "ไม่มีโรคประจำตัวที่ระบุ"}
                  </strong>
                </div>

                {/* Blood type & Mobility row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: ".82rem", display: "block" }}>
                      กรุ๊ปเลือด
                    </span>
                    <strong style={{ fontSize: "1rem", color: "var(--navy)" }}>
                      {profile.bloodType && profile.bloodType !== "ไม่ระบุ"
                        ? `กรุ๊ป ${profile.bloodType}`
                        : "ไม่ระบุ"}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: ".82rem", display: "block" }}>
                      การเคลื่อนไหว
                    </span>
                    <strong style={{ fontSize: ".92rem", color: "var(--navy)" }}>
                      {profile.mobilityAid || "เดินได้ปกติ"}
                    </strong>
                  </div>
                </div>

                {/* Emergency note */}
                {profile.emergencyNote && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      fontSize: ".88rem",
                      color: "#92400e",
                    }}
                  >
                    <strong>ข้อควรระวังสำหรับผู้ช่วย:</strong> {profile.emergencyNote}
                  </div>
                )}
              </div>
            </Card>

            {/* Family & Emergency Contact Card */}
            <Card className="form-card" style={{ borderLeft: "4px solid #16a34a" }}>
              <h3
                style={{
                  margin: "0 0 14px",
                  fontSize: "1.15rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#166534",
                }}
              >
                <Users size={20} color="#16a34a" /> ติดต่อครอบครัวกรณีฉุกเฉิน
              </h3>

              {profile.familyContact?.name || profile.familyContact?.phone ? (
                <div className="stack" style={{ gap: 12 }}>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 14,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <span style={{ color: "var(--muted)", fontSize: ".82rem" }}>
                      ผู้ติดต่อหลักในครอบครัว
                    </span>
                    <h4 style={{ margin: "4px 0 2px", fontSize: "1.15rem", color: "#14532d" }}>
                      {profile.familyContact.name || "คนในครอบครัว"}
                    </h4>
                    <p style={{ margin: 0, fontSize: ".88rem", color: "#166534" }}>
                      ความสัมพันธ์: {profile.familyContact.relationship || "ครอบครัว"}
                    </p>

                    {profile.familyContact.phone && (
                      <div style={{ marginTop: 14 }}>
                        <a
                          href={`tel:${profile.familyContact.phone}`}
                          className="button button-primary"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            width: "100%",
                            minHeight: 48,
                            background: "#16a34a",
                            color: "#fff",
                            fontWeight: 750,
                            textDecoration: "none",
                            borderRadius: 12,
                          }}
                        >
                          <Phone size={18} /> โทรหาครอบครัว ({profile.familyContact.phone})
                        </a>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: ".82rem",
                      color: "var(--muted)",
                      padding: "4px 8px",
                    }}
                  >
                    <Info size={16} />
                    <span>ผู้ช่วยจะสามารถดูเบอร์นี้ได้เมื่อรับงานของคุณ เพื่อติดต่อในกรณีฉุกเฉิน</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "26px 14px", color: "var(--muted)" }}>
                  <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                  <p style={{ margin: "0 0 10px", fontWeight: 600 }}>ยังไม่ได้ระบุข้อมูลติดต่อครอบครัว</p>
                  <button
                    className="button button-ghost"
                    onClick={() => setIsEditing(true)}
                    style={{ fontSize: ".88rem" }}
                  >
                    + เพิ่มเบอร์ครอบครัว
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
