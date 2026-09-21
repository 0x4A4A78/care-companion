import { AuthenticatedPortal } from "../../../components/authenticated-portal";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortal role="customer">{children}</AuthenticatedPortal>;
}
