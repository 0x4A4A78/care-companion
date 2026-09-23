"use client";

import {
  ExternalLink,
  Search,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Card } from "../../../../components/ui";
import { formatThaiDate, serviceCategoryLabel } from "../../../../lib/data/presentation";
import type { ServiceRequestView } from "../../../../lib/data/types";
import { type ServiceStatus, serviceStatusLabel } from "../../../../lib/service-status";

export function RequestTableClient({
  initialRequests,
}: {
  initialRequests: ServiceRequestView[];
}) {
  const [requests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.companionName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.pickup.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: requests.length,
    requested: requests.filter((r) => r.status === "requested").length,
    accepted: requests.filter((r) => ["accepted", "upcoming"].includes(r.status)).length,
    in_service: requests.filter((r) => r.status === "in_service").length,
    completed: requests.filter((r) => r.status === "completed").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  return (
    <Card className="data-card">
      <div className="data-card-header" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2>รายการคำขอบริการทั้งหมด ({filtered.length})</h2>
          <small>ติดตามความคืบหน้าของคำขอเดินทางในระบบทุกขั้นตอน</small>
        </div>

        <label className="top-search" style={{ minWidth: 260 }}>
          <Search size={18} />
          <input
            placeholder="ค้นหาเลขคำขอ, ลูกค้า, หรือสถานที่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            >
              <X size={15} color="var(--muted)" />
            </button>
          )}
        </label>
      </div>

      {/* Status Filter Tabs */}
      <div className="admin-filter-bar">
        {[
          { id: "all", label: "ทั้งหมด", count: statusCounts.all },
          { id: "requested", label: "รอผู้ช่วย", count: statusCounts.requested },
          { id: "accepted", label: "ตอบรับแล้ว", count: statusCounts.accepted },
          { id: "in_service", label: "กำลังให้บริการ", count: statusCounts.in_service },
          { id: "completed", label: "เสร็จสิ้น", count: statusCounts.completed },
          { id: "cancelled", label: "ยกเลิกแล้ว", count: statusCounts.cancelled },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-filter-tab ${statusFilter === tab.id ? "active" : ""}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>รหัสคำขอ</th>
              <th>ประเภท</th>
              <th>ผู้ใช้บริการ</th>
              <th>ผู้ช่วยที่รับงาน</th>
              <th>วันและเวลา</th>
              <th>เส้นทาง</th>
              <th>สถานะ</th>
              <th>ดูงาน</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
                  ไม่พบคำขอบริการตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ fontFamily: "monospace", color: "var(--blue)" }}>
                      {r.referenceNo}
                    </strong>
                  </td>
                  <td>
                    <Badge tone="blue">
                      {serviceCategoryLabel[r.category as keyof typeof serviceCategoryLabel] ?? r.category}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <UserRound size={15} style={{ color: "var(--muted)" }} />
                      <span>{r.customerName ?? "ผู้ใช้บริการ"}</span>
                    </div>
                  </td>
                  <td>
                    {r.companionName ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <UserCheck size={15} style={{ color: "var(--green)" }} />
                        <strong>{r.companionName}</strong>
                      </div>
                    ) : (
                      <span style={{ color: "#b45309", fontSize: ".84rem", fontStyle: "italic" }}>
                        ยังไม่มีผู้ช่วย
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: ".88rem" }}>
                      <strong>{formatThaiDate(r.serviceDate)}</strong>
                      <div style={{ color: "var(--muted)" }}>
                        {r.startTime} น. ({r.durationHours} ชม.)
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: ".85rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                      <div style={{ color: "var(--muted)" }}>ต้นทาง: {r.pickup}</div>
                      <div><strong>ปลายทาง: {r.destination}</strong></div>
                    </div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        r.status === "completed"
                          ? "green"
                          : r.status === "cancelled"
                            ? "red"
                            : r.status === "in_service"
                              ? "amber"
                              : "blue"
                      }
                    >
                      {serviceStatusLabel[r.status as ServiceStatus] ?? r.status}
                    </Badge>
                  </td>
                  <td>
                    <Link
                      href={`/customer/jobs/${r.referenceNo}`}
                      className="button button-ghost"
                      style={{ minHeight: 32, padding: "4px 10px", fontSize: ".8rem", borderRadius: 8, display: "inline-flex", gap: 4 }}
                    >
                      ดูงาน <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
