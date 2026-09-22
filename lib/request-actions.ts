import type { ServiceStatus } from "./service-status";

export type RequestAction = "accept" | "cancel" | "start" | "complete";
export type RequestActorRole = "customer" | "companion" | "admin";

export function canPerformRequestAction(
  action: RequestAction,
  status: ServiceStatus,
  role: RequestActorRole,
  isAssignedCompanion: boolean,
  isCustomerOwner: boolean,
  isAlreadyAssigned: boolean,
) {
  if (role === "admin") {
    if (action === "accept") return false;
    if (action === "start") return status === "accepted" || status === "upcoming";
    if (action === "complete") return status === "in_service";
    return ["requested", "accepted", "upcoming"].includes(status);
  }

  if (action === "accept") {
    return role === "companion" && status === "requested" && !isAlreadyAssigned;
  }
  if (action === "start") {
    return role === "companion" && isAssignedCompanion && ["accepted", "upcoming"].includes(status);
  }
  if (action === "complete") {
    return role === "companion" && isAssignedCompanion && status === "in_service";
  }
  return (isAssignedCompanion || isCustomerOwner) && ["requested", "accepted", "upcoming"].includes(status);
}
