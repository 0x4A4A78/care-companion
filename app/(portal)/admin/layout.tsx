import { AuthenticatedPortal } from "../../../components/authenticated-portal";
import { PortalShell } from "../../../components/portal-shell";
import { hasAdminPreviewSession } from "../../../lib/auth/admin-preview";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (await hasAdminPreviewSession()) {
    return <PortalShell role="admin" userName="Admin Preview" previewMode>{children}</PortalShell>;
  }
  return <AuthenticatedPortal role="admin">{children}</AuthenticatedPortal>;
}
