"use client";

import { Search, Shield, UserCheck, UserRound, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Badge, Card } from "../../../../components/ui";
import { formatThaiDate } from "../../../../lib/data/presentation";
import type { AdminUserItem } from "../../../../lib/data/queries";

export function UserTableClient({ initialUsers }: { initialUsers: AdminUserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.serviceArea.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เปลี่ยนบทบาทไม่สำเร็จ");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success("เปลี่ยนบทบาทสำเร็จ", {
        description: `ปรับเป็น ${newRole === "admin" ? "Admin" : newRole === "companion" ? "Companion" : "Customer"} แล้ว`,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    setUpdatingId(userId);
    const newActive = !currentActive;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: newActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เปลี่ยนสถานะไม่สำเร็จ");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newActive } : u)),
      );
      toast.success(newActive ? "เปิดใช้งานบัญชีแล้ว" : "ระงับการใช้งานบัญชีแล้ว");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingId(null);
    }
  }

  const roleCounts = {
    all: users.length,
    customer: users.filter((u) => u.role === "customer").length,
    companion: users.filter((u) => u.role === "companion").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <Card className="data-card">
      <div className="data-card-header" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2>จัดการผู้ใช้งานทั้งหมด ({filteredUsers.length})</h2>
          <small>ดูรายชื่อ ปรับเปลี่ยนบทบาท และควบคุมการเปิดใช้งานบัญชี</small>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <label className="top-search" style={{ minWidth: 240 }}>
            <Search size={18} />
            <input
              placeholder="ค้นหาชื่อ หรือพื้นที่..."
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
      </div>

      {/* Role Tabs */}
      <div className="admin-filter-bar">
        {[
          { id: "all", label: "ทั้งหมด", icon: Users, count: roleCounts.all },
          { id: "customer", label: "Customer", icon: UserRound, count: roleCounts.customer },
          { id: "companion", label: "Companion", icon: UserCheck, count: roleCounts.companion },
          { id: "admin", label: "Admin", icon: Shield, count: roleCounts.admin },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`admin-filter-tab ${roleFilter === tab.id ? "active" : ""}`}
              onClick={() => setRoleFilter(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ผู้ใช้งาน</th>
              <th>พื้นที่</th>
              <th>บทบาท (Role)</th>
              <th>สถานะตรวจสอบ</th>
              <th>สถานะบัญชี</th>
              <th>วันที่ลงทะเบียน</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
                  ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        name={u.fullName.slice(0, 2)}
                        tone={u.role === "admin" ? "blue" : u.role === "companion" ? "green" : "rose"}
                      />
                      <div>
                        <strong>{u.fullName}</strong>
                        {u.experienceYears ? (
                          <small style={{ display: "block", color: "var(--muted)" }}>
                            ประสบการณ์ {u.experienceYears} ปี · {u.hourlyRate ?? 300} บ./ชม.
                          </small>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>{u.serviceArea}</td>
                  <td>
                    <select
                      className="admin-role-select"
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="customer">Customer (ผู้ใช้บริการ)</option>
                      <option value="companion">Companion (ผู้ช่วย)</option>
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                    </select>
                  </td>
                  <td>
                    <Badge
                      tone={
                        u.verificationStatus === "approved"
                          ? "green"
                          : u.verificationStatus === "rejected"
                            ? "red"
                            : "amber"
                      }
                    >
                      {u.verificationStatus === "approved"
                        ? "อนุมัติแล้ว"
                        : u.verificationStatus === "rejected"
                          ? "ปฏิเสธ"
                          : "รอตรวจสอบ"}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={u.isActive ? "green" : "red"}>
                      {u.isActive ? "ปกติ" : "ระงับใช้งาน"}
                    </Badge>
                  </td>
                  <td>{formatThaiDate(u.createdAt.slice(0, 10))}</td>
                  <td>
                    <button
                      type="button"
                      className={`button ${u.isActive ? "button-danger" : "button-primary"}`}
                      style={{ minHeight: 34, padding: "4px 12px", fontSize: ".82rem", borderRadius: 8 }}
                      disabled={updatingId === u.id}
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                    >
                      {u.isActive ? "ระงับ" : "เปิดใช้"}
                    </button>
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
