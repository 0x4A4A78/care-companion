import { ClipboardList } from "lucide-react";
import { Badge } from "../../../../components/ui";
import { getAllRequestsForAdmin } from "../../../../lib/data/queries";
import { RequestTableClient } from "./request-table-client";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await getAllRequestsForAdmin();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <Badge tone="blue">
            <ClipboardList size={15} /> การจัดการคำขอ
          </Badge>
          <h1 style={{ marginTop: 8 }}>คำขอบริการทั้งหมด</h1>
          <p>ติดตามและตรวจสอบรายการคำขอบริการเดินทางในระบบ Care Companion</p>
        </div>
      </div>

      <RequestTableClient initialRequests={requests} />
    </div>
  );
}
