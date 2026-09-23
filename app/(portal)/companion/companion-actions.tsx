"use client";

import { Check, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AcceptRequestButton({
  requestId,
  isApproved = true,
}: {
  requestId: string;
  isApproved?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function accept() {
    if (!isApproved) {
      toast.error("ไม่สามารถรับงานได้", {
        description: "คุณต้องได้รับการอนุมัติตัวตนจากผู้ดูแลระบบก่อน จึงจะสามารถรับงานได้ครับ",
      });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถตอบรับงานได้");

      toast.success("ตอบรับคำขอเรียบร้อยแล้ว", {
        description: "งานถูกเพิ่มในตารางงานของคุณแล้ว",
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "เกิดข้อผิดพลาดในการตอบรับ");
    } finally {
      setBusy(false);
    }
  }

  if (!isApproved) {
    return (
      <button
        type="button"
        className="button"
        style={{
          background: "#f8fafc",
          color: "var(--muted)",
          borderColor: "var(--line)",
          cursor: "not-allowed",
          opacity: 0.85,
        }}
        onClick={() => {
          toast.error("ยังไม่สามารถรับงานได้", {
            description: "บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์จากแอดมินครับ",
          });
        }}
        title="ต้องได้รับการอนุมัติตัวตนจากแอดมินก่อนจึงจะรับงานได้"
      >
        <Lock size={17} /> รอแอดมินอนุมัติสิทธิ์
      </button>
    );
  }

  return (
    <button
      className="button button-primary"
      onClick={accept}
      disabled={busy}
    >
      <Check size={18} /> {busy ? "กำลังตอบรับ..." : "ตอบรับคำขอนี้"}
    </button>
  );
}
