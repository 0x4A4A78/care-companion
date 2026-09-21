import type { ServiceStatus } from "../service-status";

export type CompanionView = {
  id: string;
  name: string;
  area: string;
  bio: string;
  verificationStatus: "pending" | "approved" | "rejected";
  experienceYears: number;
  skills: string[];
  languages: string[];
  hourlyRate: number;
  transportation: string;
  available: boolean;
  rating: number | null;
  reviewCount: number;
};

export type ServiceRequestView = {
  id: string;
  referenceNo: string;
  customerId: string;
  companionId: string | null;
  category: keyof typeof import("./presentation").serviceCategoryLabel;
  serviceDate: string;
  startTime: string;
  durationHours: number;
  pickup: string;
  destination: string;
  supportNeeds: string[];
  notes: string;
  status: ServiceStatus;
  createdAt: string;
  customerName?: string;
  companionName?: string;
};
