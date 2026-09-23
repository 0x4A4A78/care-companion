import { Settings } from "lucide-react";
import { Badge } from "../../../../components/ui";
import { getAdminSettingsData } from "../../../../lib/data/queries";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settingsData = await getAdminSettingsData();

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <Badge tone="blue">
            <Settings size={15} /> การตั้งค่าระบบ
          </Badge>
          <h1 style={{ marginTop: 8 }}>สถานะและการตั้งค่าระบบ</h1>
          <p>ตรวจสอบความพร้อมของระบบฐานข้อมูล เสียง AI และนโยบายการทำงานของแพลตฟอร์ม</p>
        </div>
      </div>

      <SettingsClient initialData={settingsData} />
    </div>
  );
}
