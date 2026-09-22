import { ArrowRight, CalendarDays, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Card } from "../../../../components/ui";
import { getPortalUser } from "../../../../lib/auth/portal-user";
import { formatMoney, formatThaiDate, serviceCategoryLabel } from "../../../../lib/data/presentation";
import { getCompanionProfileOwner, getOpenRequests } from "../../../../lib/data/queries";
import { AcceptRequestButton } from "../companion-actions";

export const dynamic = "force-dynamic";

export default async function CompanionRequestsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  const [requests, profile] = await Promise.all([getOpenRequests(50), getCompanionProfileOwner(user.id)]);
  const hourlyRate = profile?.hourlyRate ?? 300;

  return <div className="page-wrap">
    <div className="page-header"><div><h1>คำขอใหม่จาก Customer</h1><p>เลือกงานที่เหมาะกับเวลา พื้นที่ และความสามารถของคุณ</p></div><Badge tone="blue">{requests.length} งานที่รอผู้ช่วย</Badge></div>
    <div className="stack">
      {requests.length === 0 ? <Card className="form-card empty-state"><Search size={36} /><h2>ยังไม่มีคำขอใหม่</h2><p>เมื่อ Customer สร้างคำขอ งานจะปรากฏที่นี่โดยอัตโนมัติ</p></Card> : requests.map((item) =>
        <Card className="form-card companion-request-card" key={item.id}>
          <div className="card-title"><div><Badge tone="blue">{serviceCategoryLabel[item.category] ?? item.category}</Badge><h2>{item.customerName ?? "ผู้ใช้บริการ"}</h2><small>หมายเลข {item.referenceNo}</small></div><strong className="request-price">ประมาณ {formatMoney(item.durationHours * hourlyRate)} บาท</strong></div>
          <div className="summary-list">
            <div className="summary-row"><span><CalendarDays size={17} /> วันและเวลา</span><strong>{formatThaiDate(item.serviceDate)} · {item.startTime} น. · {item.durationHours} ชั่วโมง</strong></div>
            <div className="summary-row"><span><MapPin size={17} /> เส้นทาง</span><strong>{item.pickup} <ArrowRight size={14} className="inline-icon" /> {item.destination}</strong></div>
            <div className="summary-row"><span>ต้องการให้ช่วย</span><strong>{item.supportNeeds.length ? item.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป"}</strong></div>
          </div>
          <div className="form-actions companion-request-actions"><Link className="button button-ghost" href={`/companion/jobs/${item.referenceNo}`}>ดูรายละเอียด</Link><AcceptRequestButton requestId={item.id} /></div>
        </Card>)}
    </div>
  </div>;
}
