import { ArrowRight, CalendarDays, Clock, MapPin, Search } from "lucide-react";
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
  const isApproved = profile?.verificationStatus === "approved";

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>คำขอใหม่จาก Customer</h1>
          <p>เลือกงานที่เหมาะกับเวลา พื้นที่ และความสามารถของคุณ</p>
        </div>
        <Badge tone="blue">{requests.length} งานที่รอผู้ช่วย</Badge>
      </div>

      <div className="stack">
        {!isApproved && (
          <Card
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderRadius: 16,
            }}
          >
            <Clock size={26} style={{ color: "#d97706", flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#92400e", display: "block", fontSize: ".98rem" }}>
                บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์จากผู้ดูแลระบบ
              </strong>
              <span style={{ fontSize: ".88rem", color: "#b45309" }}>
                {profile?.verificationStatus === "rejected"
                  ? "เอกสารยืนยันตัวตนไม่ผ่านการอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบแก้ไข"
                  : "เมื่อผู้ดูแลระบบตรวจสอบเอกสารและอนุมัติสิทธิ์แล้ว คุณจะสามารถกดรับงานจากผู้ใช้บริการได้ทันทีครับ"}
              </span>
            </div>
          </Card>
        )}

        {requests.length === 0 ? (
          <Card className="form-card empty-state">
            <Search size={36} />
            <h2>ยังไม่มีคำขอใหม่</h2>
            <p>เมื่อ Customer สร้างคำขอ งานจะปรากฏที่นี่โดยอัตโนมัติ</p>
          </Card>
        ) : (
          requests.map((item) => (
            <Card className="form-card companion-request-card" key={item.id}>
              <div className="card-title">
                <div>
                  <Badge tone="blue">{serviceCategoryLabel[item.category] ?? item.category}</Badge>
                  <h2>{item.customerName ?? "ผู้ใช้บริการ"}</h2>
                  <small>หมายเลข {item.referenceNo}</small>
                </div>
                <strong className="request-price">ประมาณ {formatMoney(item.durationHours * hourlyRate)} บาท</strong>
              </div>
              <div className="summary-list">
                <div className="summary-row">
                  <span>
                    <CalendarDays size={17} /> วันและเวลา
                  </span>
                  <strong>
                    {formatThaiDate(item.serviceDate)} · {item.startTime} น. · {item.durationHours} ชั่วโมง
                  </strong>
                </div>
                <div className="summary-row">
                  <span>
                    <MapPin size={17} /> เส้นทาง
                  </span>
                  <strong>
                    {item.pickup} <ArrowRight size={14} className="inline-icon" /> {item.destination}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>ต้องการให้ช่วย</span>
                  <strong>{item.supportNeeds.length ? item.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป"}</strong>
                </div>
              </div>
              <div className="form-actions companion-request-actions" style={{ justifyContent: "flex-end" }}>
                <AcceptRequestButton requestId={item.id} isApproved={isApproved} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
