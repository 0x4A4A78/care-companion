"use client";

import { FileCheck2, FileUp, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge, Card } from "../../../../components/ui";
import { verificationDocumentLabels } from "../../../../lib/verification-document";

type VerificationDocument = {
  id: string;
  document_type: keyof typeof verificationDocumentLabels;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

export function VerificationUploader() {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [documentType, setDocumentType] = useState<keyof typeof verificationDocumentLabels>("id_card");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/companion/verification")
      .then((response) => response.json())
      .then((body) => setDocuments(body.data ?? []))
      .catch(() => undefined);
  }, []);

  async function upload() {
    if (!file) return toast.error("กรุณาเลือกไฟล์เอกสาร");
    setUploading(true);
    try {
      const form = new FormData();
      form.set("documentType", documentType);
      form.set("file", file);
      const response = await fetch("/api/companion/verification", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "อัปโหลดเอกสารไม่สำเร็จ");
      setDocuments((current) => [body.data, ...current]);
      setFile(null);
      const input = document.getElementById("verification-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.success("ส่งเอกสารให้ผู้ดูแลระบบตรวจสอบแล้ว");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "อัปโหลดเอกสารไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="form-card">
      <h2><ShieldCheck size={21} /> เอกสารยืนยันตัวตน</h2>
      <p style={{ color: "var(--muted)" }}>ไฟล์จะเก็บแบบส่วนตัวใน Supabase Storage และเปิดดูได้เฉพาะคุณกับ Admin</p>
      <div className="form-grid">
        <label className="field">
          <span>ประเภทเอกสาร</span>
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value as keyof typeof verificationDocumentLabels)}>
            {Object.entries(verificationDocumentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>ไฟล์ JPG, PNG หรือ PDF (ไม่เกิน 5 MB)</span>
          <input id="verification-file" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
      </div>
      <button type="button" className="button button-primary" disabled={uploading || !file} onClick={upload} style={{ marginTop: 14 }}>
        <FileUp size={18} /> {uploading ? "กำลังอัปโหลด..." : "ส่งเอกสารตรวจสอบ"}
      </button>

      {documents.length > 0 && (
        <div className="stack" style={{ gap: 8, marginTop: 18 }}>
          {documents.map((item) => (
            <div key={item.id} className="summary-row">
              <span><FileCheck2 size={17} /> {verificationDocumentLabels[item.document_type] ?? "เอกสารยืนยัน"}</span>
              <Badge tone={item.status === "approved" ? "green" : item.status === "rejected" ? "red" : "amber"}>
                {item.status === "approved" ? "อนุมัติแล้ว" : item.status === "rejected" ? "ต้องแก้ไข" : "รอตรวจสอบ"}
              </Badge>
              {item.review_note && <small style={{ color: "var(--muted)" }}>{item.review_note}</small>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
