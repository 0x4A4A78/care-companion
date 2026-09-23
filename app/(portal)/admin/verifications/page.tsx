import { ShieldCheck } from "lucide-react";
import { Badge } from "../../../../components/ui";
import { getVerificationCompanionsForAdmin } from "../../../../lib/data/queries";
import { VerificationClient } from "./verification-client";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const companions = await getVerificationCompanionsForAdmin();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <Badge tone="blue">
            <ShieldCheck size={15} /> ตรวจสอบตัวตน
          </Badge>
          <h1 style={{ marginTop: 8 }}>ตรวจสอบและอนุมัติสิทธิ์ Companion</h1>
          <p>พิจารณาข้อมูลประวัติ ประสบการณ์ และเอกสารยืนยันตัวตนของผู้ช่วยร่วมเดินทาง</p>
        </div>
      </div>

      <VerificationClient initialCompanions={companions} />
    </div>
  );
}
