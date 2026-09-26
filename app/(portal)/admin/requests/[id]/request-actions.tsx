"use client";

import { Ban, CheckCircle2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { ServiceStatus } from "../../../../../lib/service-status";

export function AdminRequestActions({ requestId, status }: { requestId: string; status: ServiceStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "cancel" | "start" | "complete") {
    setBusy(true);
    try {
      const response = await fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cancellationReason: action === "cancel" ? "ยกเลิกโดยผู้ดูแลระบบ" : undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "อัปเดตสถานะไม่สำเร็จ");
      toast.success("อัปเดตสถานะคำขอแล้ว");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {["accepted", "upcoming"].includes(status) && <button className="button button-primary" disabled={busy} onClick={() => act("start")}><Play size={17} /> เริ่มบริการ</button>}
      {status === "in_service" && <button className="button button-primary" disabled={busy} onClick={() => act("complete")}><CheckCircle2 size={17} /> ปิดงาน</button>}
      {["requested", "accepted", "upcoming"].includes(status) && <button className="button button-danger" disabled={busy} onClick={() => act("cancel")}><Ban size={17} /> ยกเลิกคำขอ</button>}
    </div>
  );
}
