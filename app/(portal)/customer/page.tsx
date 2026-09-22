import {
  ArrowRight,
  CalendarDays,
  Check,
  Hand,
  Heart,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card } from "../../../components/ui";
import { getPortalUser } from "../../../lib/auth/portal-user";
import { formatMoney, formatThaiDate, serviceCategoryLabel } from "../../../lib/data/presentation";
import { getCustomerDashboardData } from "../../../lib/data/queries";

const tones = ["green", "blue", "rose"] as const;

export default async function CustomerDashboard() {
  const user = await getPortalUser();
  const data = user ? await getCustomerDashboardData(user.id) : null;
  const activeReq = data?.activeRequest;
  const companions = data?.recommendedCompanions ?? [];
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
          <Card className="welcome">
            <div>
              <span className="eyebrow">CARE COMPANION</span>
              <h2>พร้อมช่วยให้ทุกธุระเป็นเรื่องง่าย</h2>
              <p>บอกวัน เวลา และสถานที่ ระบบจะแนะนำผู้ช่วยที่เหมาะกับคุณ</p>
            </div>
            <Link className="button button-primary" href="/customer/request">
              เริ่มสร้างคำขอ
            </Link>
          </Card>

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

          <div>
            <div className="section-title">
              <h2>ผู้ช่วยแนะนำสำหรับคุณ</h2>
              <Link className="text-link" href="/companions">
                ดูทั้งหมด <ArrowRight size={16} />
              </Link>
            </div>

            {companions.length === 0 ? (
              <Card className="form-card" style={{ textAlign: "center", padding: "35px" }}>
                <Users size={32} style={{ margin: "0 auto 10px", color: "var(--blue)" }} />
                <h3>ยังไม่มีผู้ช่วยที่เปิดรับงานในขณะนี้</h3>
                <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>
                  ระบบจะแสดงรายชื่อ Companion เมื่อมีการลงทะเบียนและอนุมัติในระบบแล้ว
                </p>
              </Card>
            ) : (
              <div className="companion-grid">
                {companions.map((person, idx) => {
                  const tone = tones[idx % tones.length];
                  const initials = person.name.slice(0, 2);
                  return (
                    <Card key={person.id} className="companion-card">
                      <div className="companion-profile">
                        <Avatar name={initials} tone={tone} />
                        <div>
                          <h3>{person.name}</h3>
                          <p>
                            <Star size={15} fill="#f3a712" color="#f3a712" />{" "}
                            {person.rating ? person.rating.toFixed(1) : "ใหม่"}{" "}
                            <small>({person.reviewCount} รีวิว)</small>
                          </p>
                        </div>
                      </div>
                      <Badge tone="green">
                        <Check size={14} /> ยืนยันตัวตนแล้ว
                      </Badge>
                      <p>
                        ประสบการณ์ {person.experienceYears} ปี
                        <br />
                        {person.area}
                      </p>
                      <div className="skill-list">
                        {person.skills.slice(0, 3).map((s) => (
                          <Badge tone="gray" key={s}>
                            {s}
                          </Badge>
                        ))}
                      </div>
                      <div className="price-row">
                        <span>เริ่มต้น</span>
                        <strong>{formatMoney(person.hourlyRate)} บาท/ชม.</strong>
                      </div>
                      <Link
                        className="button button-primary button-full"
                        href={`/companions/${person.id}`}
                      >
                        ดูโปรไฟล์
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
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
