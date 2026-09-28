import {
  ArrowRight,
  CalendarDays,
  Check,
  Hand,
  Heart,
  Phone,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Badge, Card } from "../../../components/ui";
import { getPortalUser } from "../../../lib/auth/portal-user";
import { formatThaiDate, serviceCategoryLabel } from "../../../lib/data/presentation";
import { getCustomerDashboardData } from "../../../lib/data/queries";

export default async function CustomerDashboard() {
  const user = await getPortalUser();
  const data = user ? await getCustomerDashboardData(user.id) : null;
  const activeReq = data?.activeRequest;
  const contact = data?.trustedContact;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>
            สวัสดี {user?.name ?? "ผู้ใช้บริการ"} <Hand size={28} />
          </h1>
          <p>วันนี้อยากให้เราช่วยเรื่องอะไร?</p>
        </div>
        <Link
          href="/customer/request"
          className="button button-primary button-large"
        >
          <Plus size={22} /> ขอผู้ช่วยเดินทาง
        </Link>
      </div>

      <div className="grid-main">
        <div className="stack">
          {activeReq ? (
            <Card className="status-card">
              <div className="card-title">
                <div>
                  <h2>สถานะคำขอ · {serviceCategoryLabel[activeReq.category] ?? activeReq.category}</h2>
                  <small style={{ color: "var(--muted)" }}>หมายเลข {activeReq.referenceNo}</small>
                </div>
                <Badge tone={activeReq.status === "cancelled" ? "red" : activeReq.status === "completed" ? "green" : "blue"}>
                  {activeReq.status === "requested" && "กำลังค้นหาผู้ช่วย"}
                  {activeReq.status === "accepted" && "ผู้ช่วยตอบรับแล้ว"}
                  {activeReq.status === "upcoming" && "ใกล้ถึงวันนัดหมาย"}
                  {activeReq.status === "in_service" && "กำลังให้บริการ"}
                  {activeReq.status === "completed" && "บริการเสร็จสิ้น"}
                  {activeReq.status === "cancelled" && "ยกเลิกแล้ว"}
                </Badge>
              </div>

              <div className="status-track">
                {[
                  ["1", "ส่งคำขอแล้ว", "done"],
                  ["2", "กำลังค้นหาผู้ช่วย", activeReq.status === "requested" ? "active" : "done"],
                  ["3", "ยืนยันผู้ช่วย", ["accepted", "upcoming"].includes(activeReq.status) ? "active" : ["in_service", "completed"].includes(activeReq.status) ? "done" : ""],
                  ["4", "เริ่มให้บริการ", activeReq.status === "in_service" ? "active" : activeReq.status === "completed" ? "done" : ""],
                ].map(([n, l, c]) => (
                  <div className={`status-step ${c}`} key={l}>
                    <b>{c === "done" ? <Check size={19} /> : n}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, textAlign: "right" }}>
                <Link className="text-link" href={`/customer/jobs/${activeReq.referenceNo}`}>
                  ดูรายละเอียดและติดตามงาน <ArrowRight size={15} style={{ display: "inline", verticalAlign: "middle" }} />
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="status-card" style={{ textAlign: "center", padding: "30px 20px" }}>
              <div className="card-title" style={{ justifyContent: "center" }}>
                <h2>สถานะบริการ</h2>
              </div>
              <p style={{ color: "var(--muted)", margin: "8px 0 16px" }}>
                คุณยังไม่มีคำขอบริการที่กำลังดำเนินการอยู่ในขณะนี้
              </p>
              <Link href="/customer/request" className="button button-ghost">
                <Plus size={18} /> ขอผู้ช่วยเดินทางใหม่
              </Link>
            </Card>
          )}

        </div>

        <aside className="stack">
          <Card className="side-card">
            <div className="card-title">
              <h3>
                <CalendarDays size={20} /> นัดหมายครั้งถัดไป
              </h3>
            </div>
            {activeReq ? (
              <div className="appointment">
                <strong>{serviceCategoryLabel[activeReq.category] ?? activeReq.category}</strong>
                <p>{formatThaiDate(activeReq.serviceDate)} · {activeReq.startTime} น.</p>
                <p>{activeReq.destination}</p>
                <Link className="text-link" href={`/customer/jobs/${activeReq.referenceNo}`}>
                  ดูรายละเอียดทั้งหมด
                </Link>
              </div>
            ) : (
              <p style={{ color: "var(--muted)", margin: "10px 0" }}>ไม่มีนัดหมายเร็ว ๆ นี้</p>
            )}

            <div className="quick-contact" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Phone />
              <div style={{ flex: 1 }}>
                <strong>ติดต่อครอบครัว</strong>
                <br />
                <small>{contact ? `${contact.name} (${contact.relationship})` : "ยังไม่ได้ระบุผู้ติดต่อ"}</small>
              </div>
              {contact?.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="button button-primary"
                  style={{ minHeight: 36, padding: "0 12px", fontSize: ".82rem", textDecoration: "none" }}
                  title={`โทรหา ${contact.name}`}
                >
                  โทรออก
                </a>
              ) : (
                <Link
                  href="/customer/profile"
                  className="text-link"
                  style={{ fontSize: ".82rem" }}
                >
                  + เพิ่มเบอร์
                </Link>
              )}
            </div>
          </Card>

          <Card className="side-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Heart color="#e11d48" size={18} /> ข้อมูลสุขภาพของคุณ
              </h3>
              <Link href="/customer/profile" className="text-link" style={{ fontSize: ".82rem" }}>
                แก้ไข
              </Link>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: ".85rem", color: "var(--muted)", lineHeight: 1.45 }}>
              ระบุประวัติแพ้ยา โรคประจำตัว และกรุ๊ปเลือด เพื่อให้ผู้ช่วยดูแลคุณได้อย่างปลอดภัย
            </p>
            <Link href="/customer/profile" className="button button-ghost button-full" style={{ minHeight: 40, fontSize: ".88rem" }}>
              จัดการข้อมูลสุขภาพ
            </Link>
          </Card>

          <Card className="side-card">
            <ShieldCheck color="var(--blue)" />
            <h3>ขอบเขตบริการ</h3>
            <p className="disclaimer">
              บริการช่วยเดินทางและทำธุระ ไม่ใช่บริการทางการแพทย์
              หากเจ็บป่วยฉุกเฉิน กรุณาโทร 1669
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
