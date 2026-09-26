import { CalendarDays, ChevronLeft, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card } from "../../../../../components/ui";
import { formatThaiDate, serviceCategoryLabel } from "../../../../../lib/data/presentation";
import { getRequestByReference } from "../../../../../lib/data/queries";
import { serviceStatusLabel } from "../../../../../lib/service-status";
import { AdminRequestActions } from "./request-actions";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequestByReference(id);
  if (!request) notFound();

  return (
    <div className="page-wrap">
      <Link href="/admin/requests" className="text-link"><ChevronLeft size={18} /> กลับไปรายการคำขอ</Link>
      <div className="page-header" style={{ marginTop: 16 }}>
        <div>
          <Badge tone={request.status === "completed" ? "green" : request.status === "cancelled" ? "red" : "blue"}>{serviceStatusLabel[request.status]}</Badge>
          <h1 style={{ marginTop: 8 }}>{serviceCategoryLabel[request.category] ?? request.category} · {request.referenceNo}</h1>
          <p>Customer: {request.customerName ?? "-"} · Companion: {request.companionName ?? "ยังไม่มีผู้ช่วย"}</p>
        </div>
        <AdminRequestActions requestId={request.id} status={request.status} />
      </div>
      <Card className="form-card">
        <h2>รายละเอียดการเดินทาง</h2>
        <div className="summary-list">
          <div className="summary-row"><span><CalendarDays size={17} /> นัดหมาย</span><strong>{formatThaiDate(request.serviceDate)} เวลา {request.startTime} น.</strong></div>
          <div className="summary-row"><span><Clock3 size={17} /> ระยะเวลา</span><strong>{request.durationHours} ชั่วโมง</strong></div>
          <div className="summary-row"><span><MapPin size={17} /> ต้นทาง</span><strong>{request.pickup}</strong></div>
          <div className="summary-row"><span><MapPin size={17} /> จุดหมาย</span><strong>{request.destination}</strong></div>
          <div className="summary-row"><span>สิ่งที่ต้องการให้ช่วย</span><strong>{request.supportNeeds.length ? request.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป"}</strong></div>
          {request.notes && <div className="summary-row"><span>หมายเหตุ</span><strong>{request.notes}</strong></div>}
        </div>
      </Card>
    </div>
  );
}
