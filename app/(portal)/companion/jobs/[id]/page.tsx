import { CalendarDays, ChevronLeft, Clock3, ExternalLink, MapPin, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Card } from "../../../../../components/ui";
import { getPortalUser } from "../../../../../lib/auth/portal-user";
import { formatThaiDate, serviceCategoryLabel } from "../../../../../lib/data/presentation";
import { getRequestByReference, getRequestMessages } from "../../../../../lib/data/queries";
import { buildOpenStreetMapUrl } from "../../../../../lib/map-links";
import { serviceStatusLabel } from "../../../../../lib/service-status";
import { JobChatSection } from "../../../customer/jobs/[id]/job-actions";
import { AcceptRequestButton } from "../../companion-actions";
import { CompanionJobActions } from "./job-actions";

export const dynamic = "force-dynamic";

export default async function CompanionJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  const { id } = await params;
  const request = await getRequestByReference(id);
  const isOpen = request?.status === "requested" && !request.companionId;
  const isMine = request?.companionId === user.id;

  if (!request || (!isOpen && !isMine)) return <div className="page-wrap"><Card className="form-card empty-state"><h1>ไม่พบงาน หรือคุณไม่มีสิทธิ์ดูงานนี้</h1><p>งานอาจมี Companion คนอื่นตอบรับไปแล้ว</p><Link href="/companion/requests" className="button button-primary">กลับไปดูคำขอใหม่</Link></Card></div>;

  const messages = isMine ? await getRequestMessages(request.id) : [];
  const pickupMapUrl = isMine
    ? buildOpenStreetMapUrl(request.pickupLatitude, request.pickupLongitude)
    : null;
  return <div className="page-wrap">
    <Link href={isMine ? "/companion/jobs" : "/companion/requests"} className="text-link companion-back-link"><ChevronLeft size={18} /> กลับไปหน้ารายการ</Link>
    <div className="page-header"><div><Badge tone={request.status === "completed" ? "green" : request.status === "cancelled" ? "red" : "blue"}>{serviceStatusLabel[request.status]}</Badge><h1>{serviceCategoryLabel[request.category] ?? request.category} · {request.referenceNo}</h1><p>{formatThaiDate(request.serviceDate)} เวลา {request.startTime} น. ({request.durationHours} ชั่วโมง)</p></div>{isOpen ? <AcceptRequestButton requestId={request.id} /> : <CompanionJobActions requestId={request.id} status={request.status} />}</div>
    <div className="grid-main"><div className="stack">
      <Card className="form-card"><h2>รายละเอียดการเดินทาง</h2><div className="summary-list"><div className="summary-row"><span><CalendarDays size={17} /> นัดหมาย</span><strong>{formatThaiDate(request.serviceDate)} เวลา {request.startTime} น.</strong></div><div className="summary-row"><span><Clock3 size={17} /> ระยะเวลา</span><strong>ประมาณ {request.durationHours} ชั่วโมง</strong></div><div className="summary-row"><span><MapPin size={17} /> ต้นทาง</span><strong>{request.pickup}{pickupMapUrl && <a href={pickupMapUrl} target="_blank" rel="noreferrer" className="map-link-row"><ExternalLink size={16} /> เปิดแผนที่จุดนัดรับ</a>}</strong></div><div className="summary-row"><span><MapPin size={17} /> จุดหมาย</span><strong>{request.destination}</strong></div><div className="summary-row"><span>ต้องการให้ช่วย</span><strong>{request.supportNeeds.length ? request.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป"}</strong></div>{request.notes && <div className="summary-row"><span>หมายเหตุ</span><strong>{request.notes}</strong></div>}</div></Card>
      {isMine && <JobChatSection requestId={request.id} companionName={request.customerName} initialMessages={messages} currentUserId={user.id} title="ห้องแชทกับผู้ใช้บริการ" />}
    </div><aside className="stack"><Card className="side-card"><UserRound color="var(--blue)" /><h3>Customer</h3><p><strong>{request.customerName ?? "ผู้ใช้บริการ"}</strong></p><p className="disclaimer">ใช้ระบบแชตเพื่อนัดหมายและยืนยันรายละเอียดก่อนเดินทาง</p></Card><Card className="side-card"><ShieldCheck color="var(--green)" /><h3>ขอบเขตการให้บริการ</h3><p className="disclaimer">ช่วยอำนวยความสะดวกในการเดินทางและทำธุระเท่านั้น ไม่ใช่บริการทางการแพทย์ หากฉุกเฉินโทร 1669</p></Card></aside></div>
  </div>;
}
