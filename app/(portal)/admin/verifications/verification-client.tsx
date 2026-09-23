"use client";

import {
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Badge, Card } from "../../../../components/ui";
import { formatThaiDate } from "../../../../lib/data/presentation";
import type { AdminVerificationItem } from "../../../../lib/data/queries";

export function VerificationClient({
  initialCompanions,
}: {
  initialCompanions: AdminVerificationItem[];
}) {
  const [companions, setCompanions] = useState(initialCompanions);
  const [filter, setFilter] = useState<string>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = companions.filter((c) => {
    if (filter === "all") return true;
    return c.verificationStatus === filter;
  });

  const counts = {
    pending: companions.filter((c) => c.verificationStatus === "pending").length,
    approved: companions.filter((c) => c.verificationStatus === "approved").length,
    rejected: companions.filter((c) => c.verificationStatus === "rejected").length,
    all: companions.length,
  };

  async function updateStatus(companionId: string, status: "approved" | "rejected" | "pending") {
    setUpdatingId(companionId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companionId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");

      setCompanions((prev) =>
        prev.map((c) =>
          c.id === companionId ? { ...c, verificationStatus: status } : c,
        ),
      );

      const statusLabels = {
        approved: "อนุมัติสิทธิ์ Companion เรียบร้อยแล้ว",
        rejected: "ปฏิเสธการยืนยันตัวตนแล้ว",
        pending: "ปรับเป็นรอตรวจสอบแล้ว",
      };
      toast.success(statusLabels[status]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Status Filter Tabs */}
      <div className="admin-filter-bar">
        {[
          { id: "pending", label: "รอการตรวจสอบ", icon: Clock, count: counts.pending },
          { id: "approved", label: "อนุมัติแล้ว", icon: CheckCircle2, count: counts.approved },
          { id: "rejected", label: "ปฏิเสธแล้ว", icon: XCircle, count: counts.rejected },
          { id: "all", label: "ทั้งหมด", icon: ShieldCheck, count: counts.all },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`admin-filter-tab ${filter === tab.id ? "active" : ""}`}
              onClick={() => setFilter(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Companions Cards */}
      {filtered.length === 0 ? (
        <Card className="form-card empty-state" style={{ textAlign: "center", padding: "48px 20px" }}>
          <ShieldCheck size={44} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
          <h3>ไม่มีรายการในหมวดหมู่นี้</h3>
          <p style={{ color: "var(--muted)" }}>
            {filter === "pending"
              ? "ยอดเยี่ยม! ไม่มี Companion ที่รอตรวจสอบตัวตนในขณะนี้"
              : "ไม่พบข้อมูล Companion ตามตัวกรองที่เลือก"}
          </p>
        </Card>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {filtered.map((item) => (
            <Card key={item.id} className="form-card admin-verification-card">
              <div className="admin-verification-header">
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={item.fullName.slice(0, 2)} tone="green" large />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{item.fullName}</h3>
                      <Badge
                        tone={
                          item.verificationStatus === "approved"
                            ? "green"
                            : item.verificationStatus === "rejected"
                              ? "red"
                              : "amber"
                        }
                      >
                        {item.verificationStatus === "approved"
                          ? "อนุมัติแล้ว"
                          : item.verificationStatus === "rejected"
                            ? "ปฏิเสธ"
                            : "รอตรวจสอบ"}
                      </Badge>
                    </div>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".88rem" }}>
                      <MapPin size={14} style={{ display: "inline", verticalAlign: "middle" }} /> พื้นที่: {item.serviceArea} · ลงทะเบียนเมื่อ {formatThaiDate(item.createdAt.slice(0, 10))}
                    </p>
                  </div>
                </div>

                <div className="admin-verification-actions">
                  {item.verificationStatus !== "approved" && (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ background: "linear-gradient(135deg, #10b981, #059669)", minHeight: 40, padding: "8px 18px", fontSize: ".9rem" }}
                      disabled={updatingId === item.id}
                      onClick={() => updateStatus(item.id, "approved")}
                    >
                      <CheckCircle2 size={16} /> อนุมัติสิทธิ์
                    </button>
                  )}
                  {item.verificationStatus !== "rejected" && (
                    <button
                      type="button"
                      className="button button-danger"
                      style={{ minHeight: 40, padding: "8px 18px", fontSize: ".9rem" }}
                      disabled={updatingId === item.id}
                      onClick={() => updateStatus(item.id, "rejected")}
                    >
                      <XCircle size={16} /> ปฏิเสธ
                    </button>
                  )}
                  {item.verificationStatus !== "pending" && (
                    <button
                      type="button"
                      className="button button-ghost"
                      style={{ minHeight: 40, padding: "8px 14px", fontSize: ".88rem" }}
                      disabled={updatingId === item.id}
                      onClick={() => updateStatus(item.id, "pending")}
                    >
                      รอตรวจสอบ
                    </button>
                  )}
                </div>
              </div>

              {/* Bio & Details */}
              <div style={{ margin: "14px 0", padding: "12px 16px", background: "#f8fafc", borderRadius: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: ".95rem", color: "var(--navy)" }}>
                  <strong>แนะนำตัว:</strong> {item.bio || "ไม่ได้ระบุข้อความแนะนำตัว"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: ".88rem", color: "var(--muted)" }}>
                  <span>ประสบการณ์: <strong>{item.experienceYears} ปี</strong></span>
                  <span>ค่าบริการ: <strong>{item.hourlyRate} บาท/ชม.</strong></span>
                </div>
              </div>

              {/* Skills */}
              {item.skills.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".85rem", color: "var(--muted)", fontWeight: 650 }}>ทักษะ:</span>
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "3px 10px",
                        background: "#eaf4ff",
                        color: "var(--blue-dark)",
                        borderRadius: 999,
                        fontSize: ".8rem",
                        fontWeight: 650,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
