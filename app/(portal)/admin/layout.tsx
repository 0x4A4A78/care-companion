import { AuthenticatedPortal } from "../../../components/authenticated-portal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortal role="admin">{children}</AuthenticatedPortal>;
}
