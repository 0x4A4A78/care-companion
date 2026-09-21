import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Badge, Card, Stat } from "../../../components/ui";
import { formatThaiDate, serviceCategoryLabel } from "../../../lib/data/presentation";
import { getAdminDashboardData } from "../../../lib/data/queries";

export default async function AdminDashboard() {
  const { stats, recentProfiles, recentRequests } = await getAdminDashboardData();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <Badge tone="blue">
            <ShieldCheck size={15} /> Admin Console
          </Badge>
          <h1 style={{ marginTop: 8 }}>ภาพรวมระบบจริง</h1>
          <p>ข้อมูลทั้งหมดดึงตรงจากฐานข้อมูล Supabase PostgreSQL</p>
        </div>
      </div>

      <div className="stats">
        <Stat
          label="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers.toString()}
          detail="ในตาราง profiles"
        />
        <Stat
          label="Companion ยืนยันแล้ว"
          value={stats.verifiedCompanions.toString()}
          detail={`รอตรวจสอบ ${stats.pendingCompanions} คน`}
        />
        <Stat
          label="คำขอที่กำลังดำเนินการ"
          value={stats.activeRequests.toString()}
          detail="กำลังจับคู่หรือให้บริการ"
        />
        <Stat
          label="บริการสำเร็จ"
          value={stats.completedRequests.toString()}
          detail="งานที่เสร็จสิ้นสมบูรณ์"
        />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card className="data-card">
            <div className="data-card-header">
              <div>
                <h2>จัดการผู้ใช้งานจริง ({stats.totalUsers})</h2>
                <small>บัญชี Customer, Companion และ Admin ในระบบ</small>
              </div>
              <label className="top-search">
                <Search size={18} />
                <input placeholder="ค้นหาชื่อในระบบ..." />
              </label>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ชื่อ - นามสกุล</th>
                    <th>ประเภท</th>
                    <th>สถานะการตรวจสอบ</th>
                    <th>วันที่ลงทะเบียน</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                        ยังไม่มีผู้ใช้งานในระบบ
                      </td>
                    </tr>
                  ) : (
                    recentProfiles.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.full_name}</strong>
                        </td>
                        <td>
                          <Badge tone={p.role === "admin" ? "blue" : p.role === "companion" ? "green" : "gray"}>
                            {p.role === "admin" ? "Admin" : p.role === "companion" ? "Companion" : "Customer"}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={p.verification_status === "approved" ? "green" : p.verification_status === "rejected" ? "red" : "amber"}>
                            {p.verification_status === "approved" ? "อนุมัติแล้ว" : p.verification_status === "rejected" ? "ปฏิเสธ" : "รอตรวจสอบ"}
                          </Badge>
                        </td>
                        <td>{formatThaiDate(p.created_at.slice(0, 10))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="data-card">
            <div className="data-card-header">
              <h2>คำขอบริการล่าสุด ({recentRequests.length})</h2>
              <span className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                รายการทั้งหมด <ArrowUpRight size={16} />
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>เลขที่คำขอ</th>
                    <th>ผู้ขอรับบริการ</th>
                    <th>ประเภท</th>
                    <th>วันที่ใช้บริการ</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                        ยังไม่มีคำขอบริการในระบบ
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/customer/jobs/${r.reference_no}`} className="text-link">
                            {r.reference_no}
                          </Link>
                        </td>
                        <td>{r.customerName}</td>
                        <td>{serviceCategoryLabel[r.category as keyof typeof serviceCategoryLabel] ?? r.category}</td>
                        <td>{formatThaiDate(r.service_date)}</td>
                        <td>
                          <Badge tone={r.status === "completed" ? "green" : r.status === "cancelled" ? "red" : r.status === "in_service" ? "amber" : "blue"}>
                            {r.status === "requested" && "รอผู้ช่วย"}
                            {r.status === "accepted" && "ตอบรับแล้ว"}
                            {r.status === "upcoming" && "ใกล้วันนัด"}
                            {r.status === "in_service" && "กำลังให้บริการ"}
                            {r.status === "completed" && "เสร็จสิ้น"}
                            {r.status === "cancelled" && "ยกเลิกแล้ว"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <aside className="stack">
          <Card className="side-card">
            <div className="card-title">
              <h3>
                <BadgeCheck size={20} /> รอตรวจสอบตัวตน
              </h3>
              <Badge tone={stats.pendingCompanions > 0 ? "amber" : "green"}>
                {stats.pendingCompanions}
              </Badge>
            </div>
            {stats.pendingCompanions > 0 ? (
              <p style={{ color: "var(--muted)" }}>
                มี Companion ที่ส่งข้อมูลและรอการอนุมัติสิทธิ์ {stats.pendingCompanions} ท่าน
              </p>
            ) : (
              <p style={{ color: "var(--muted)" }}>
                ไม่มี Companion ที่รอการตรวจสอบตัวตนในขณะนี้
              </p>
            )}
          </Card>

          <Card className="side-card">
            <div className="card-title">
              <h3>
                <AlertTriangle size={20} color="var(--amber)" /> ศูนย์ควบคุมความปลอดภัย
              </h3>
            </div>
            <p style={{ fontSize: ".9rem", color: "var(--muted)", lineHeight: 1.6 }}>
              ตรวจสอบความถูกต้องของสิทธิ์ RLS และสถานะการทำงานของระบบ Supabase PostgreSQL
            </p>
            <div className="disclaimer" style={{ marginTop: 12 }}>
              ระบบเชื่อมโยงกับฐานข้อมูลจริง ข้อมูลผู้ใช้และคำขอจะอัปเดตแบบเรียลไทม์
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
