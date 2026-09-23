import {
  ArrowRight,
  CalendarDays,
  Clock,
  Clock3,
  Hand,
  MapPin,
  Navigation,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge, Card, Stat } from "../../../components/ui";
import { getPortalUser } from "../../../lib/auth/portal-user";
import { formatMoney, formatThaiDate, serviceCategoryLabel } from "../../../lib/data/presentation";
import { getCompanionDashboardData } from "../../../lib/data/queries";
import { AcceptRequestButton } from "./companion-actions";

export default async function CompanionDashboard() {
  const user = await getPortalUser();
  const data = user ? await getCompanionDashboardData(user.id) : null;
  const isApproved = data?.verificationStatus === "approved";

  const openRequests = data?.openRequests ?? [];
  const myJobs = data?.myJobs ?? [];
  const activeJobs = myJobs.filter((j) => ["accepted", "upcoming", "in_service"].includes(j.status));
  const completedJobs = myJobs.filter((j) => j.status === "completed");
  const nextJob = activeJobs[0];

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>
            สวัสดี {user?.name ?? "ผู้ช่วยร่วมเดินทาง"} <Hand size={28} />
          </h1>
          <p>ตรวจสอบคำขอใหม่และตารางงานจริงของคุณ</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge
            tone={
              data?.verificationStatus === "approved"
                ? "green"
                : data?.verificationStatus === "rejected"
                  ? "red"
                  : "amber"
            }
          >
            {data?.verificationStatus === "approved" ? (
              <>
                <ShieldCheck size={16} /> อนุมัติสิทธิ์แล้ว
              </>
            ) : data?.verificationStatus === "rejected" ? (
              <>
                <XCircle size={16} /> ไม่ผ่านการอนุมัติ
              </>
            ) : (
              <>
                <Clock size={16} /> รอแอดมินอนุมัติสิทธิ์
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="stats">
        <Stat
          label="คำขอใหม่"
          value={openRequests.length.toString()}
          detail="รอการตอบรับ"
        />
        <Stat
          label="งานของฉัน"
          value={activeJobs.length.toString()}
          detail="กำลังดำเนินการ"
        />
        <Stat
          label="งานสำเร็จ"
          value={completedJobs.length.toString()}
          detail="เสร็จสิ้นทั้งหมด"
        />
        <Stat
          label="คะแนนเฉลี่ย"
          value={data?.averageRating ? data.averageRating.toFixed(1) : "ใหม่"}
          detail={data?.reviewCount ? `จาก ${data.reviewCount} รีวิว` : "ยังไม่มีรีวิว"}
        />
      </div>

      <div className="grid-main">
        <div className="stack">
          <div className="section-title">
            <h2>คำขอใหม่ที่รอผู้ช่วย ({openRequests.length})</h2>
            <Link className="text-link" href="/companion/requests">ดูคำขอทั้งหมด</Link>
          </div>

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
                  {data?.verificationStatus === "rejected"
                    ? "เอกสารยืนยันตัวตนไม่ผ่านการอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบแก้ไข"
                    : "เมื่อผู้ดูแลระบบตรวจสอบเอกสารและอนุมัติสิทธิ์แล้ว คุณจะสามารถกดรับงานจากผู้ใช้บริการได้ทันทีครับ"}
                </span>
              </div>
            </Card>
          )}

          {openRequests.length === 0 ? (
            <Card className="form-card" style={{ textAlign: "center", padding: "35px" }}>
              <h3>ไม่มีคำขอใหม่ในขณะนี้</h3>
              <p style={{ color: "var(--muted)", margin: "8px 0" }}>
                เมื่อมีผู้ใช้บริการสร้างคำขอใหม่ในระบบ คำขอจะปรากฏที่นี่ทันที
              </p>
            </Card>
          ) : (
            openRequests.map((req) => (
              <Card className="form-card" key={req.id}>
                <div className="card-title">
                  <div>
                    <Badge tone="blue">{serviceCategoryLabel[req.category] ?? req.category}</Badge>
                    <h2 style={{ marginTop: 8 }}>{req.customerName ?? "ผู้ใช้บริการ"}</h2>
                    <small style={{ color: "var(--muted)" }}>หมายเลข {req.referenceNo}</small>
                  </div>
                  <strong style={{ fontSize: "1.2rem", color: "var(--blue)" }}>
                    ประมาณ {formatMoney(req.durationHours * (data?.detail?.hourly_rate ? Number(data.detail.hourly_rate) : 300))} บาท
                  </strong>
                </div>

                <div className="summary-list">
                  <div className="summary-row">
                    <span>
                      <CalendarDays size={17} /> วันและเวลา
                    </span>
                    <strong>{formatThaiDate(req.serviceDate)} · {req.startTime} น. · {req.durationHours} ชั่วโมง</strong>
                  </div>
                  <div className="summary-row">
                    <span>
                      <MapPin size={17} /> เส้นทาง
                    </span>
                    <strong>
                      {req.pickup} <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /> {req.destination}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span>ต้องการให้ช่วย</span>
                    <strong>{req.supportNeeds.length ? req.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป"}</strong>
                  </div>
                  {req.notes && (
                    <div className="summary-row">
                      <span>หมายเหตุ</span>
                      <strong>{req.notes}</strong>
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                  <AcceptRequestButton requestId={req.id} isApproved={isApproved} />
                </div>
              </Card>
            ))
          )}

          {nextJob ? (
            <Card className="form-card">
              <div className="card-title">
                <h2>งานที่ต้องเดินทาง ({serviceCategoryLabel[nextJob.category] ?? nextJob.category})</h2>
                <Badge tone="amber">
                  {nextJob.status === "in_service" ? "กำลังให้บริการ" : "ตอบรับแล้ว"}
                </Badge>
              </div>
              <h3>ผู้รับบริการ: {nextJob.customerName ?? "ผู้ใช้บริการ"}</h3>
              <p>
                <Clock3 size={17} style={{ display: "inline", verticalAlign: "middle" }} /> {formatThaiDate(nextJob.serviceDate)} · {nextJob.startTime} น. ({nextJob.durationHours} ชม.)
              </p>
              <p>
                <MapPin size={17} style={{ display: "inline", verticalAlign: "middle" }} /> {nextJob.destination}
              </p>
              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <Link href={`/companion/jobs/${nextJob.referenceNo}`} className="button button-primary">
                  <Navigation size={18} /> เริ่มงาน / ติดตามงาน
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="form-card" style={{ textAlign: "center", padding: "30px" }}>
              <h3>ยังไม่มีงานที่ต้องเดินทางเร็ว ๆ นี้</h3>
              <p style={{ color: "var(--muted)", margin: "6px 0" }}>
                งานที่คุณตอบรับจะแสดงในส่วนนี้ เพื่อให้คุณสามารถเตรียมตัวเดินทางได้สะดวก
              </p>
            </Card>
          )}
        </div>

        <aside className="stack">
          <Card className="side-card">
            <h3>ความพร้อมของโปรไฟล์</h3>
            <div
              style={{
                height: 10,
                background: "#e4eaf1",
                borderRadius: 10,
                overflow: "hidden",
                margin: "12px 0 8px",
              }}
            >
              <div
                style={{
                  width: data?.detail ? "100%" : "60%",
                  height: "100%",
                  background: "var(--green)",
                }}
              />
            </div>
            <p>
              <strong>{data?.detail ? "ยืนยันข้อมูลแล้ว 100%" : "ข้อมูล 60%"}</strong>
              <br />
              <small style={{ color: "var(--muted)" }}>
                {data?.detail?.available ? "เปิดรับงานอยู่ ผู้ใช้บริการสามารถค้นหาคุณเจอ" : "คุณกำลังพักรับงาน"}
              </small>
            </p>
          </Card>

          <Card className="side-card">
            <h3>ตารางงานของคุณ ({activeJobs.length})</h3>
            {activeJobs.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: "10px 0" }}>ยังไม่มีงานในตาราง</p>
            ) : (
              activeJobs.slice(0, 3).map((j) => (
                <div className="appointment" key={j.id} style={{ marginTop: 8 }}>
                  <strong>{formatThaiDate(j.serviceDate)} · {j.startTime} น.</strong>
                  <p>{serviceCategoryLabel[j.category] ?? j.category} · {j.customerName ?? "ผู้ใช้บริการ"}</p>
                  <Link className="text-link" href={`/companion/jobs/${j.referenceNo}`}>
                    ดูงานนี้
                  </Link>
                </div>
              ))
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
