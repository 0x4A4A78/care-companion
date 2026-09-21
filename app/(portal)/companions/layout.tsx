import { AuthenticatedPortal } from "../../../components/authenticated-portal";
export default function CompanionsLayout({ children }: { children: React.ReactNode }) { return <AuthenticatedPortal role="customer">{children}</AuthenticatedPortal>; }
