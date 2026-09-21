import { redirect } from "next/navigation";
import { getRoleHome } from "../../lib/auth/roles";
import { getPortalUser } from "../../lib/auth/portal-user";

export default async function ChooseRolePage() {
  const user = await getPortalUser();
  if (!user) redirect("/login?error=session");
  redirect(getRoleHome(user.role));
}
