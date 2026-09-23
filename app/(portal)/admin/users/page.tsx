import { Users } from "lucide-react";
import { Badge } from "../../../../components/ui";
import { getAllUsersForAdmin } from "../../../../lib/data/queries";
import { UserTableClient } from "./user-table-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAllUsersForAdmin();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <Badge tone="blue">
            <Users size={15} /> การจัดการผู้ใช้งาน
          </Badge>
          <h1 style={{ marginTop: 8 }}>ผู้ใช้งานในระบบ Care Companion</h1>
          <p>ตรวจสอบรายชื่อ ปรับเปลี่ยนสิทธิ์ และควบคุมการใช้งานของผู้ใช้ทั้งหมด</p>
        </div>
      </div>

      <UserTableClient initialUsers={users} />
    </div>
  );
}
