export const serviceStatuses = [
  "requested",
  "accepted",
  "upcoming",
  "in_service",
  "completed",
  "cancelled",
] as const;

export type ServiceStatus = (typeof serviceStatuses)[number];

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  requested: "รอผู้ช่วยตอบรับ",
  accepted: "ผู้ช่วยตอบรับแล้ว",
  upcoming: "ใกล้ถึงวันนัดหมาย",
  in_service: "กำลังให้บริการ",
  completed: "เสร็จสิ้นบริการ",
  cancelled: "ยกเลิกแล้ว",
};

const transitions: Record<ServiceStatus, ServiceStatus[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["upcoming", "cancelled"],
  upcoming: ["in_service", "cancelled"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionService(
  current: ServiceStatus,
  next: ServiceStatus,
) {
  return transitions[current].includes(next);
}

export function getNextServiceStatus(status: ServiceStatus) {
  return transitions[status].find((next) => next !== "cancelled") ?? null;
}
