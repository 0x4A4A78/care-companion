import "server-only";

import { createClient } from "../supabase/server";
import type { AppRole } from "./roles";

export type PortalUser = {
  id: string;
  name: string;
  role: AppRole;
};

export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) return null;

  return {
    id: user.id,
    name: profile.full_name,
    role: profile.role as AppRole,
  };
}
