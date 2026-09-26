import { Check, Filter, MapPin, Search, Star, Users } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "../../../lib/data/presentation";
import { getCompanions } from "../../../lib/data/queries";
import { Avatar, Badge, Card } from "../../../components/ui";

const tones = ["green", "blue", "rose"] as const;

export default async function CompanionsPage({ searchParams }: { searchParams: Promise<{ q?: string; area?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase("th") ?? "";
  const area = params.area?.trim().toLocaleLowerCase("th") ?? "";
  const allCompanions = await getCompanions();
  const companions = allCompanions.filter((person) => {
    const searchable = [person.name, person.bio, ...person.skills, ...person.languages].join(" ").toLocaleLowerCase("th");
    return (!query || searchable.includes(query)) && (!area || person.area.toLocaleLowerCase("th").includes(area));
  });

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>ค้นหาผู้ช่วยร่วมเดินทาง</h1>
          <p>เลือกจากข้อมูล ประสบการณ์ พื้นที่ให้บริการ และอัตราค่าบริการจริงในระบบ</p>
        </div>
      </div>
      <Card className="form-card">
        <form method="get">
        <div className="form-grid">
          <label className="field">
            <span>ค้นหาชื่อหรือความสามารถ</span>
            <div className="top-search">
              <Search size={20} />
              <input name="q" defaultValue={params.q ?? ""} placeholder="เช่น พาไปโรงพยาบาล ช่วยใช้รถเข็น" />
            </div>
          </label>
          <label className="field">
            <span>พื้นที่ให้บริการ</span>
            <input name="area" defaultValue={params.area ?? ""} placeholder="เช่น บางนา นนทบุรี สุขุมวิท" />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button type="submit" className="button button-primary"><Search size={18} /> ค้นหาผู้ช่วย</button>
          {(query || area) && <Link href="/companions" className="button button-ghost">ล้างตัวกรอง</Link>}
        </div>
        </form>
        <div className="skill-list" style={{ marginTop: 16 }}>
          <Badge tone="blue">
            <Filter size={14} /> ผู้ช่วยที่พร้อมรับงาน
          </Badge>
          <Badge tone="gray">ยืนยันตัวตนแล้ว</Badge>
          <Badge tone="gray">มีประสบการณ์</Badge>
        </div>
      </Card>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>พบผู้ช่วย {companions.length} คน</h2>
        <span>เรียงตาม: แนะนำ</span>
      </div>

      {companions.length === 0 ? (
        <Card className="form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div className="success-icon" style={{ background: "var(--sky)", color: "var(--blue)" }}>
            <Users size={36} />
          </div>
          <h2>ยังไม่พบผู้ช่วยที่เปิดให้บริการในขณะนี้</h2>
          <p style={{ color: "var(--muted)", maxWidth: 520, margin: "10px auto 22px" }}>
            {query || area
              ? "ไม่พบผู้ช่วยที่ตรงกับคำค้นหรือพื้นที่ ลองเปลี่ยนเงื่อนไขแล้วค้นหาอีกครั้ง"
              : "ขณะนี้ยังไม่มี Companion ที่ได้รับการอนุมัติและเปิดรับงาน กรุณาลองใหม่ภายหลังหรือสร้างคำขอไว้ก่อนได้"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/customer/request" className="button button-primary">
              สร้างคำขอใช้บริการ
            </Link>
          </div>
        </Card>
      ) : (
        <div className="companion-grid">
          {companions.map((person, idx) => {
            const tone = tones[idx % tones.length];
            const initials = person.name.slice(0, 2);
            return (
              <Card className="companion-card" key={person.id}>
                <div className="companion-profile">
                  <Avatar name={initials} tone={tone} large />
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
                <p>ประสบการณ์ {person.experienceYears} ปี</p>
                <p>
                  <MapPin size={15} /> {person.area}
                </p>
                <div className="skill-list">
                  {person.skills.slice(0, 3).map((s) => (
                    <Badge tone="gray" key={s}>
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="price-row">
                  <span>ค่าบริการ</span>
                  <strong>{formatMoney(person.hourlyRate)} บาท/ชม.</strong>
                </div>
                <Link
                  className="button button-primary button-full"
                  href={`/companions/${person.id}`}
                >
                  ดูโปรไฟล์และเลือกผู้ช่วย
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
