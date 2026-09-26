"use client";

import { BriefcaseBusiness, Car, Languages, MapPin, Save, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge, Card } from "../../../../components/ui";
import type { CompanionProfileOwnerView } from "../../../../lib/data/queries";
import { VerificationUploader } from "./verification-uploader";

const suggestedSkills = [
  "พาไปโรงพยาบาล",
  "ช่วยงานเอกสาร",
  "ติดต่อธนาคาร",
  "ติดต่อราชการ",
  "เดินเป็นเพื่อน",
  "ช่วยใช้รถเข็น",
];

function splitList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function CompanionProfileEditor({ initialProfile }: { initialProfile: CompanionProfileOwnerView }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: initialProfile.fullName,
    serviceArea: initialProfile.serviceArea,
    bio: initialProfile.bio,
    experienceYears: initialProfile.experienceYears,
    skills: initialProfile.skills.join(", "),
    languages: initialProfile.languages.join(", "),
    hourlyRate: initialProfile.hourlyRate,
    transportation: initialProfile.transportation,
    available: initialProfile.available,
  });

  function addSkill(skill: string) {
    const skills = splitList(form.skills);
    if (!skills.includes(skill)) skills.push(skill);
    setForm((current) => ({ ...current, skills: skills.join(", ") }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/companion/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          experienceYears: Number(form.experienceYears),
          hourlyRate: Number(form.hourlyRate),
          skills: splitList(form.skills),
          languages: splitList(form.languages),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "บันทึกโปรไฟล์ไม่สำเร็จ");
      toast.success("บันทึกโปรไฟล์ผู้ช่วยเรียบร้อยแล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "บันทึกโปรไฟล์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack companion-profile-form" onSubmit={save}>
      <div className="page-header companion-profile-header">
        <div>
          <h1>โปรไฟล์ผู้ช่วยร่วมเดินทาง</h1>
          <p>ข้อมูลนี้ช่วยให้ Customer เลือกผู้ช่วยที่เหมาะสมและตัดสินใจได้ง่ายขึ้น</p>
        </div>
        <Badge tone={initialProfile.verificationStatus === "approved" ? "green" : initialProfile.verificationStatus === "rejected" ? "red" : "amber"}>
          {initialProfile.verificationStatus === "approved" ? "ยืนยันตัวตนแล้ว" : initialProfile.verificationStatus === "rejected" ? "ไม่ผ่านการตรวจสอบ" : "รอตรวจสอบตัวตน"}
        </Badge>
      </div>

      <Card className="form-card">
        <h2><UserRound size={21} /> ข้อมูลแนะนำตัว</h2>
        <div className="form-grid">
          <label className="field"><span>ชื่อ-นามสกุล *</span><input required maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <label className="field"><span><MapPin size={15} /> พื้นที่ให้บริการ</span><input maxLength={300} placeholder="เช่น บางนา สุขุมวิท สมุทรปราการ" value={form.serviceArea} onChange={(event) => setForm({ ...form, serviceArea: event.target.value })} /></label>
          <label className="field field-full"><span>แนะนำตัวและประสบการณ์</span><textarea rows={4} maxLength={1000} placeholder="เล่าประสบการณ์และลักษณะการช่วยเหลือที่ถนัด" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
        </div>
      </Card>

      <Card className="form-card">
        <h2><BriefcaseBusiness size={21} /> ประสบการณ์และค่าบริการ</h2>
        <div className="form-grid">
          <label className="field"><span>ประสบการณ์ (ปี)</span><input type="number" min={0} max={60} value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} /></label>
          <label className="field"><span>ค่าบริการต่อชั่วโมง (บาท)</span><input type="number" min={0} max={10000} step={50} value={form.hourlyRate} onChange={(event) => setForm({ ...form, hourlyRate: Number(event.target.value) })} /></label>
          <label className="field field-full"><span>ความสามารถ (คั่นด้วยเครื่องหมายจุลภาค)</span><input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="เช่น พาไปโรงพยาบาล, ช่วยงานเอกสาร" /><div className="profile-skill-chips">{suggestedSkills.map((skill) => <button type="button" key={skill} onClick={() => addSkill(skill)}>+ {skill}</button>)}</div></label>
          <label className="field"><span><Languages size={15} /> ภาษาที่สื่อสารได้</span><input required value={form.languages} onChange={(event) => setForm({ ...form, languages: event.target.value })} placeholder="ภาษาไทย, English" /></label>
          <label className="field"><span><Car size={15} /> การเดินทาง</span><input maxLength={300} value={form.transportation} onChange={(event) => setForm({ ...form, transportation: event.target.value })} placeholder="เช่น รถยนต์ส่วนตัว หรือรถสาธารณะ" /></label>
        </div>
      </Card>

      <VerificationUploader />

      <div className="profile-save-actions"><button className="button button-primary button-large" type="submit" disabled={saving}><Save size={20} /> {saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</button></div>
    </form>
  );
}
