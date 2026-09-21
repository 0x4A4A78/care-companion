"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AvailabilityToggle({ initialAvailable }: { initialAvailable: boolean }) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !available;
    try {
      const res = await fetch("/api/companion/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถเปลี่ยนสถานะได้");

      setAvailable(next);
      toast.info(next ? "เปิดรับงานแล้ว" : "พักการรับงานแล้ว", {
        description: next
          ? "Customer สามารถเห็นว่าคุณพร้อมรับงาน"
          : "ระบบจะไม่แนะนำงานใหม่ชั่วคราว",
      });
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`button ${available ? "button-primary" : "button-ghost"}`}
      onClick={toggle}
      disabled={busy}
    >
      {available ? (
        <>
          <Check size={19} /> พร้อมรับงาน
        </>
      ) : (
        <>
          <X size={19} /> ไม่สะดวกรับงาน
        </>
      )}
    </button>
  );
}

export function AcceptRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function accept() {
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
