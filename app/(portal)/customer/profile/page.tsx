import { redirect } from "next/navigation";
import { getPortalUser } from "../../../../lib/auth/portal-user";
import { getCustomerProfile } from "../../../../lib/data/queries";
import { ProfileEditor } from "./profile-editor";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const user = await getPortalUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCustomerProfile(user.id);

  if (!profile) {
    // Fallback initial structure
    const fallbackProfile = {
      id: user.id,
      fullName: user.name,
      role: user.role,
      serviceArea: "",
      bio: "",
      phone: "",
      allergies: "",
      chronicDiseases: "",
      bloodType: "ไม่ระบุ",
      mobilityAid: "เดินได้ปกติ",
      emergencyNote: "",
      familyContact: null,
    };
    return (
      <div className="page-wrap">
        <ProfileEditor initialProfile={fallbackProfile} />
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <ProfileEditor initialProfile={profile} />
    </div>
  );
}
