import {
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Card } from "../../../../../components/ui";
import { getPortalUser } from "../../../../../lib/auth/portal-user";
import { formatThaiDate, serviceCategoryLabel } from "../../../../../lib/data/presentation";
import { getRequestByReference, getRequestMessages } from "../../../../../lib/data/queries";
import { createClient } from "../../../../../lib/supabase/server";
import { CancelRequestButton, JobChatSection } from "./job-actions";
import { JobDetailReviewSection } from "./job-review-action";

export default async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getPortalUser();
  const { id } = await params;
  const request = await getRequestByReference(id);

  if (!request) {
    return (
      <div className="page-wrap">
        <Card className="form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div className="success-icon" style={{ background: "var(--sky)", color: "var(--blue)" }}>
            <Clock size={36} />
          </div>
          <h2>ไม่พบข้อมูลคำขอบริการนี้</h2>
          <p style={{ color: "var(--muted)", maxWidth: 480, margin: "10px auto 24px" }}>
            รหัสคำขอ &ldquo;{id}&rdquo; อาจไม่ถูกต้อง หรือคำขอนี้ถูกลบออกจากระบบแล้ว
          </p>
          <Link href="/customer" className="button button-primary">
            กลับสู่หน้าหลัก
          </Link>
        </Card>
      </div>
    );
  }

  const messages = await getRequestMessages(request.id);
  const canCancel = ["requested", "accepted"].includes(request.status);

  let initialReview: { rating: number; comment: string | null } | null = null;
  if (request.status === "completed" && request.companionId) {
    try {
      const supabase = await createClient();
      const { data: revData } = await supabase
        .from("reviews")
        .select("rating, comment")
        .eq("request_id", request.id)
        .maybeSingle();
      if (revData) {
        initialReview = { rating: Number(revData.rating), comment: revData.comment };
      }
    } catch {
      // ignore lookup error
    }
  }

  return (
    <div className="page-wrap">
      <Link href="/customer" className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
        <ChevronLeft size={18} /> กลับไปหน้าหลัก
      </Link>

      <div className="page-header">
        <div>
          <Badge tone={request.status === "cancelled" ? "red" : request.status === "completed" ? "green" : "blue"}>
            {request.status === "requested" && "กำลังค้นหาผู้ช่วย"}
            {request.status === "accepted" && "ผู้ช่วยตอบรับแล้ว"}
            {request.status === "upcoming" && "ใกล้ถึงวันนัดหมาย"}
            {request.status === "in_service" && "กำลังให้บริการ"}
            {request.status === "completed" && "บริการเสร็จสิ้น"}
            {request.status === "cancelled" && "ยกเลิกแล้ว"}
          </Badge>
          <h1 style={{ marginTop: 8 }}>
            {serviceCategoryLabel[request.category] ?? request.category} · {request.referenceNo}
          </h1>
          <p>
            {formatThaiDate(request.serviceDate)} เวลา {request.startTime} น. ({request.durationHours} ชั่วโมง)
          </p>
        </div>

        <CancelRequestButton requestId={request.id} canCancel={canCancel} />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card className="status-card">
            <div className="card-title">
              <h2>สถานะบริการ</h2>
              <Badge tone="blue">
                {request.status === "requested" ? "ขั้นตอนที่ 1 จาก 4" : request.status === "accepted" ? "ขั้นตอนที่ 2 จาก 4" : request.status === "in_service" ? "ขั้นตอนที่ 3 จาก 4" : "เสร็จสิ้น"}
              </Badge>
            </div>
            <div className="status-track">
              {[
                ["1", "ส่งคำขอ", "done"],
                ["2", "ผู้ช่วยตอบรับ", request.status === "requested" ? "active" : "done"],
                ["3", "เริ่มบริการ", ["accepted", "upcoming"].includes(request.status) ? "active" : ["in_service", "completed"].includes(request.status) ? "done" : ""],
                ["4", "เสร็จสิ้น", request.status === "in_service" ? "active" : request.status === "completed" ? "done" : ""],
              ].map(([n, l, c]) => (
                <div className={`status-step ${c}`} key={l}>
                  <b>{c === "done" ? <Check size={19} /> : n}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="form-card">
            <h2>รายละเอียดการเดินทาง</h2>
            <div className="route">
              <span className="route-dot" />
              <div>
                <small>ต้นทาง · {request.startTime} น.</small>
                <strong>{request.pickup}</strong>
              </div>
            </div>
            <div className="route" style={{ marginTop: 20 }}>
              <MapPin size={17} color="var(--red)" />
              <div>
                <small>จุดหมาย</small>
                <strong>{request.destination}</strong>
              </div>
            </div>
            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "22px 0",
              }}
            />
            <p>
              <strong>ระยะเวลา:</strong> ประมาณ {request.durationHours} ชั่วโมง
            </p>
            <p>
              <strong>สิ่งที่ต้องการให้ช่วย:</strong>{" "}
              {request.supportNeeds.length ? request.supportNeeds.join(", ") : "ช่วยเหลือการเดินทางทั่วไป"}
            </p>
            {request.notes && (
              <p>
                <strong>หมายเหตุเพิ่มเติม:</strong> {request.notes}
              </p>
            )}
          </Card>

          {request.status === "completed" && request.companionId && (
            <JobDetailReviewSection
              requestId={request.id}
              referenceNo={request.referenceNo}
              companionName={request.companionName}
              initialReview={initialReview}
            />
          )}

          <JobChatSection
            requestId={request.id}
            companionName={request.companionName}
            initialMessages={messages}
            currentUserId={user?.id}
            title="ห้องแชทกับผู้ช่วย"
          />
        </div>

        <aside className="stack">
          <Card className="side-card">
            {request.companionName ? (
              <>
                <div className="companion-profile">
                  <Avatar name={request.companionName.slice(0, 2)} tone="green" large />
                  <div>
                    <h3>{request.companionName}</h3>
                    <p>
                      <Star size={15} fill="#f3a712" color="#f3a712" /> ผู้ช่วยร่วมเดินทาง
                    </p>
                  </div>
                </div>
                <Badge tone="green" style={{ marginTop: 8 }}>
                  <Check size={14} /> ตอบรับคำขอแล้ว
                </Badge>
                <div className="quick-contact">
                  <Phone />
                  <span>
                    <strong>ติดต่อผู้ช่วย</strong>
                    <br />
                    <small>ติดต่อผ่านระบบแชตเพื่อความปลอดภัย</small>
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <Users size={32} style={{ color: "var(--blue)", margin: "0 auto 10px" }} />
                <h3>กำลังค้นหาผู้ช่วย</h3>
                <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>
                  เมื่อมีผู้ช่วยตอบรับคำขอ ข้อมูลของผู้ช่วยจะปรากฏที่นี่ทันที
                </p>
                <Link href="/companions" className="button button-ghost button-full" style={{ marginTop: 12 }}>
                  ดูรายชื่อผู้ช่วยที่มีอยู่
                </Link>
              </div>
            )}
          </Card>

          <Card className="side-card">
            <ShieldCheck color="var(--blue)" />
            <h3>เพื่อความปลอดภัย</h3>
            <p className="disclaimer">
              ติดต่อผ่านระบบและแจ้งครอบครัวก่อนเดินทาง Companion ไม่ใช่บุคลากรทางการแพทย์ หากมีเหตุฉุกเฉินโทร 1669
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
