export type AppRole = "customer" | "companion" | "admin";

export function getRoleHome(role: AppRole) {
  return role === "admin" ? "/admin" : role === "companion" ? "/companion" : "/customer";
}

export function canAccessPortalRole(userRole: AppRole, portalRole: AppRole) {
  return userRole === portalRole;
}
