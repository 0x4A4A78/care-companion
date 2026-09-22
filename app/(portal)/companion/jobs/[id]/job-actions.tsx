"use client";

import { CheckCircle2, Play, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { ServiceStatus } from "../../../../../lib/service-status";

export function CompanionJobActions({ requestId, status }: { requestId: string; status: ServiceStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "start" | "complete" | "cancel") {
    if (action === "cancel" && !confirm("ต้องการยกเลิกงานนี้ใช่หรือไม่?")) return;
    setBusy(action);
    try {
      const response = await fetch(`/api/requests/${requestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "เปลี่ยนสถานะงานไม่สำเร็จ");
      toast.success(action === "start" ? "เริ่มให้บริการแล้ว" : action === "complete" ? "ปิดงานเรียบร้อยแล้ว" : "ยกเลิกงานแล้ว");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "เปลี่ยนสถานะงานไม่สำเร็จ"); }
    finally { setBusy(null); }
  }

  return <div className="companion-job-actions">
    {["accepted", "upcoming"].includes(status) && <button className="button button-primary" disabled={Boolean(busy)} onClick={() => run("start")}><Play size={18} />{busy === "start" ? "กำลังเริ่มงาน..." : "เริ่มให้บริการ"}</button>}
    {status === "in_service" && <button className="button button-primary" disabled={Boolean(busy)} onClick={() => run("complete")}><CheckCircle2 size={18} />{busy === "complete" ? "กำลังปิดงาน..." : "บริการเสร็จสิ้น"}</button>}
    {["accepted", "upcoming"].includes(status) && <button className="button button-danger" disabled={Boolean(busy)} onClick={() => run("cancel")}><XCircle size={18} />ยกเลิกงาน</button>}
  </div>;
}
