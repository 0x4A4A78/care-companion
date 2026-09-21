import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { canAccessPortalRole, getRoleHome, type AppRole } from "../lib/auth/roles";
import { getPortalUser } from "../lib/auth/portal-user";
import { PortalShell } from "./portal-shell";

export async function AuthenticatedPortal({
  role,
  children,
}: {
  role: AppRole;
  children: ReactNode;
}) {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  if (!canAccessPortalRole(user.role, role)) redirect(getRoleHome(user.role));

  return <PortalShell role={role} userName={user.name}>{children}</PortalShell>;
}
