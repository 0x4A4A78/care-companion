import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, Card } from "../../../../components/ui";
import { formatMoney } from "../../../../lib/data/presentation";
import { formatThaiDate } from "../../../../lib/data/presentation";
import { getCompanion } from "../../../../lib/data/queries";

export default async function CompanionProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getCompanion(id);
  if (!person) notFound();

  const initials = person.name.slice(0, 2);

  return (
    <div className="page-wrap">
      <Link href="/companions" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <ChevronLeft size={18} /> กลับไปค้นหาผู้ช่วย
      </Link>
      <div className="grid-main" style={{ marginTop: 18 }}>
        <div className="stack">
          <Card className="form-card">
            <div className="companion-profile">
              <Avatar name={initials} tone="green" large />
              <div>
                <Badge tone="green">
                  <BadgeCheck size={15} /> ยืนยันตัวตนแล้ว
                </Badge>
                <h1 style={{ margin: "6px 0 0" }}>{person.name}</h1>
                <p style={{ margin: 0, color: "var(--amber)" }}>
                  <Star size={15} fill="#f3a712" color="#f3a712" />{" "}
                  {person.rating ? person.rating.toFixed(1) : "ใหม่"} ({person.reviewCount} รีวิว)
                </p>
              </div>
            </div>
            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "22px 0",
              }}
            />
            <h2>เกี่ยวกับฉัน</h2>
            <p style={{ lineHeight: 1.7, color: "#334155" }}>
              {person.bio || "ยินดีเป็นเพื่อนร่วมเดินทาง ช่วยประสานงานทั่วไป รอคิว และดูแลให้คุณเดินทางถึงจุดหมายอย่างปลอดภัย"}
            </p>
            <p><strong>ประสบการณ์:</strong> {person.experienceYears} ปี</p>
            <p><strong>ยานพาหนะที่ใช้:</strong> {person.transportation}</p>

            <h2 style={{ marginTop: 24 }}>ความสามารถและภาษา</h2>
            <div className="skill-list">
              {person.skills.map((s) => (
                <Badge tone="blue" key={s}>
                  {s}
                </Badge>
              ))}
              {person.languages.map((lang) => (
                <Badge tone="gray" key={lang}>
                  <Languages size={14} /> {lang}
                </Badge>
              ))}
            </div>
            <p style={{ marginTop: 14 }}>
              <MapPin size={17} style={{ verticalAlign: "middle", display: "inline" }} /> พื้นที่ให้บริการ: {person.area}
            </p>
            <div className="disclaimer">
              <ShieldCheck size={18} />{" "}
              ผู้ช่วยให้บริการด้านการเดินทางและทำธุระเท่านั้น
              ไม่ใช่บุคลากรทางการแพทย์ และไม่ครอบคลุมการรักษาพยาบาล
            </div>
          </Card>

          <Card className="form-card">
            <h2>ความคิดเห็นจากผู้ใช้บริการ ({person.reviewCount})</h2>
            {person.reviewCount > 0 ? (
              <div className="stack" style={{ gap: 10 }}>
                {person.reviews.map((review) => (
                  <div key={review.id} style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 12 }}>
                    <strong style={{ color: "var(--amber)" }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</strong>
                    <p style={{ color: "#334155", margin: "6px 0" }}>{review.comment || "ผู้ใช้ให้คะแนนโดยไม่ได้เขียนความคิดเห็น"}</p>
                    <small style={{ color: "var(--muted)" }}>รีวิวเมื่อ {formatThaiDate(review.createdAt.slice(0, 10))}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", margin: "10px 0" }}>ยังไม่มีรีวิวสำหรับผู้ช่วยท่านนี้</p>
            )}
          </Card>
        </div>

        <aside>
          <Card className="side-card">
            <h3>
              <CalendarDays size={20} /> ขอรับบริการกับผู้ช่วยท่านนี้
            </h3>
            <div className="appointment">
              <strong>อัตราค่าบริการ</strong>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--blue)", margin: "8px 0" }}>
                {formatMoney(person.hourlyRate)} บาท/ชั่วโมง
              </p>
              <p style={{ fontSize: ".9rem", color: "var(--muted)" }}>
                {person.available ? "สถานะ: พร้อมรับงาน" : "สถานะ: พักการรับงานชั่วคราว"}
              </p>
            </div>
            <div style={{ margin: "20px 0 10px" }}>
              <Link
                href="/customer/request"
                className="button button-primary button-full"
              >
                สร้างคำขอบริการใหม่
              </Link>
            </div>
            <p className="login-note">
              ระบบจะแสดงข้อมูลติดต่อของผู้ช่วยเมื่อผู้ช่วยตอบรับคำขอแล้ว
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
