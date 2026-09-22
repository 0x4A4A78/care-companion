import { CalendarDays, ClipboardList, MapPin } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Card } from "../../../../components/ui";
import { getPortalUser } from "../../../../lib/auth/portal-user";
import { formatThaiDate, serviceCategoryLabel } from "../../../../lib/data/presentation";
import { getCompanionRequests } from "../../../../lib/data/queries";
import { serviceStatusLabel } from "../../../../lib/service-status";

export const dynamic = "force-dynamic";

export default async function CompanionJobsPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  const jobs = await getCompanionRequests(user.id);
  const active = jobs.filter((job) => ["accepted", "upcoming", "in_service"].includes(job.status));
  const history = jobs.filter((job) => ["completed", "cancelled"].includes(job.status));

  const renderJobs = (items: typeof jobs) => items.length ? items.map((job) => <Link key={job.id} href={`/companion/jobs/${job.referenceNo}`} className="job-list-link">
    <Card className="form-card job-list-card"><div><Badge tone={job.status === "completed" ? "green" : job.status === "cancelled" ? "red" : "blue"}>{serviceStatusLabel[job.status]}</Badge><h3>{serviceCategoryLabel[job.category] ?? job.category} · {job.customerName ?? "ผู้ใช้บริการ"}</h3><p><CalendarDays size={16} /> {formatThaiDate(job.serviceDate)} เวลา {job.startTime} น.</p><p><MapPin size={16} /> {job.pickup} → {job.destination}</p></div><strong>ดูรายละเอียด</strong></Card>
  </Link>) : <Card className="form-card empty-state"><ClipboardList size={34} /><p>ยังไม่มีงานในรายการนี้</p></Card>;

  return <div className="page-wrap"><div className="page-header"><div><h1>งานของฉัน</h1><p>ติดตามงานที่ตอบรับ เริ่มบริการ แชต และปิดงานได้จากที่นี่</p></div><Link className="button button-primary" href="/companion/requests">ดูคำขอใหม่</Link></div><section className="stack"><div className="section-title"><h2>งานที่กำลังดำเนินการ ({active.length})</h2></div>{renderJobs(active)}<div className="section-title job-history-title"><h2>ประวัติงาน ({history.length})</h2></div>{renderJobs(history)}</section></div>;
}
