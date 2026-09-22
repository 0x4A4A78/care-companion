import { redirect } from "next/navigation";

import { Card } from "../../../../components/ui";
import { getPortalUser } from "../../../../lib/auth/portal-user";
import { getCompanionProfileOwner } from "../../../../lib/data/queries";
import { CompanionProfileEditor } from "./profile-editor";

export const dynamic = "force-dynamic";

export default async function CompanionProfilePage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");

  const profile = await getCompanionProfileOwner(user.id);
  if (!profile) {
    return (
      <div className="page-wrap">
        <Card className="form-card empty-state">
          <h1>ไม่สามารถโหลดโปรไฟล์ผู้ช่วยได้</h1>
          <p>กรุณาลองเข้าสู่ระบบใหม่ หรือติดต่อผู้ดูแลระบบ</p>
        </Card>
      </div>
    );
  }

  return <div className="page-wrap"><CompanionProfileEditor initialProfile={profile} /></div>;
}
