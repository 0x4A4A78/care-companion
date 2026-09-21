import { AuthenticatedPortal } from "../../../components/authenticated-portal";

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedPortal role="companion">{children}</AuthenticatedPortal>;
}
