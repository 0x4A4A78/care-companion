import type { ServiceRequestInput } from "../request-schema";

export function toServiceRequestInsert(input: ServiceRequestInput, customerId: string) {
  return {
    customer_id: customerId,
    category: input.category,
    service_date: input.serviceDate,
    start_time: input.startTime,
    duration_hours: input.durationHours,
    pickup: input.pickup,
    destination: input.destination,
    support_needs: input.supportNeeds,
    notes: input.notes,
  };
}
