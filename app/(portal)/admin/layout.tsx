import { PortalShell } from "../../../components/portal-shell";
import { getPortalUser } from "../../../lib/auth/portal-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getPortalUser();
  return (
    <PortalShell role="admin" userName={user?.name ?? "ผู้ดูแลระบบ (Admin Demo)"}>
      {children}
    </PortalShell>
  );
}
