import "server-only";

import { createClient } from "../supabase/server";
import type { CompanionView, ServiceRequestView } from "./types";
export type { CompanionView, ServiceRequestView };

type ProfileRow = {
  id: string;
  full_name: string;
  service_area: string | null;
  bio: string | null;
  verification_status: CompanionView["verificationStatus"];
};

type DetailRow = {
  profile_id: string;
  experience_years: number;
  skills: string[];
  languages: string[];
  hourly_rate: number | string;
  transportation: string | null;
  available: boolean;
};

type RequestRow = {
  id: string;
  reference_no: string;
  customer_id: string;
  companion_id: string | null;
  category: ServiceRequestView["category"];
  service_date: string;
  start_time: string;
  duration_hours: number | string;
  pickup: string;
  pickup_latitude: number | string | null;
  pickup_longitude: number | string | null;
  pickup_accuracy_meters: number | string | null;
  destination: string;
  support_needs: string[];
  notes: string;
  status: ServiceRequestView["status"];
  created_at: string;
};

function mapRequest(row: RequestRow): ServiceRequestView {
  return {
    id: row.id,
    referenceNo: row.reference_no,
    customerId: row.customer_id,
    companionId: row.companion_id,
    category: row.category,
    serviceDate: row.service_date,
    startTime: (row.start_time ?? "").slice(0, 5),
    durationHours: Number(row.duration_hours),
    pickup: row.pickup,
    pickupLatitude: row.pickup_latitude === null || row.pickup_latitude === undefined ? null : Number(row.pickup_latitude),
    pickupLongitude: row.pickup_longitude === null || row.pickup_longitude === undefined ? null : Number(row.pickup_longitude),
    pickupAccuracyMeters: row.pickup_accuracy_meters === null || row.pickup_accuracy_meters === undefined ? null : Number(row.pickup_accuracy_meters),
    destination: row.destination,
    supportNeeds: row.support_needs ?? [],
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getCompanions(options: { limit?: number; availableOnly?: boolean } = {}): Promise<CompanionView[]> {
  try {
    const supabase = await createClient();
    let profilesQuery = supabase
      .from("profiles")
      .select("id, full_name, service_area, bio, verification_status")
      .eq("role", "companion")
      .eq("is_active", true)
      .eq("verification_status", "approved")
      .order("created_at", { ascending: false });

    if (options.limit) profilesQuery = profilesQuery.limit(options.limit);
    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError || !profiles?.length) return [];

    const ids = profiles.map((profile) => profile.id);
    let detailsQuery = supabase
      .from("companion_details")
      .select("profile_id, experience_years, skills, languages, hourly_rate, transportation, available")
      .in("profile_id", ids);

    if (options.availableOnly) detailsQuery = detailsQuery.eq("available", true);

    const [{ data: details }, { data: reviews }] = await Promise.all([
      detailsQuery,
      supabase.from("reviews").select("companion_id, rating").in("companion_id", ids),
    ]);

    const detailMap = new Map((details as DetailRow[] | null)?.map((detail) => [detail.profile_id, detail]) ?? []);

    return (profiles as ProfileRow[]).flatMap((profile): CompanionView[] => {
      const detail = detailMap.get(profile.id);
      if (!detail) return [];
      const ratings = (reviews ?? []).filter((review) => review.companion_id === profile.id).map((review) => Number(review.rating));
      return [{
        id: profile.id,
        name: profile.full_name,
        area: profile.service_area ?? "ยังไม่ระบุพื้นที่",
        bio: profile.bio ?? "",
        verificationStatus: profile.verification_status,
        experienceYears: detail.experience_years,
        skills: detail.skills ?? [],
        languages: detail.languages ?? [],
        hourlyRate: Number(detail.hourly_rate),
        transportation: detail.transportation ?? "ยังไม่ระบุ",
        available: detail.available,
        rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
        reviewCount: ratings.length,
        reviews: [],
      }];
    });
  } catch {
    return [];
  }
}

export async function getCompanion(id: string): Promise<CompanionView | null> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role, service_area, bio, verification_status, is_active")
      .eq("id", id)
      .maybeSingle();

    if (!profile || profile.role !== "companion" || profile.verification_status !== "approved" || !profile.is_active) return null;

    const [{ data: detail }, { data: reviews }] = await Promise.all([
      supabase.from("companion_details").select("*").eq("profile_id", id).maybeSingle(),
      supabase.from("reviews").select("id, rating, comment, created_at").eq("companion_id", id).order("created_at", { ascending: false }).limit(10),
    ]);

    if (!detail) return null;
    const ratings = (reviews ?? []).map((r) => Number(r.rating));
    return {
      id: profile.id,
      name: profile.full_name,
      area: profile.service_area ?? "ยังไม่ระบุพื้นที่",
      bio: profile.bio ?? "",
      verificationStatus: profile.verification_status,
      experienceYears: detail.experience_years,
      skills: detail.skills ?? [],
      languages: detail.languages ?? [],
      hourlyRate: Number(detail.hourly_rate),
      transportation: detail.transportation ?? "ยังไม่ระบุ",
      available: detail.available,
      rating: ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
      reviewCount: ratings.length,
      reviews: (reviews ?? []).map((review) => ({
        id: review.id,
        rating: Number(review.rating),
        comment: review.comment ?? "",
        createdAt: review.created_at,
      })),
    };
  } catch {
    return null;
  }
}

export async function getCustomerRequests(customerId: string, limit = 20): Promise<ServiceRequestView[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("service_requests")
      .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as RequestRow[]).map(mapRequest);
  } catch {
    return [];
  }
}

export async function getCustomerDashboardData(customerId: string) {
  try {
    const supabase = await createClient();
    const [requests, companions, { data: contacts }] = await Promise.all([
      getCustomerRequests(customerId, 10),
      getCompanions({ limit: 3, availableOnly: true }),
      supabase.from("trusted_contacts").select("name, relationship, phone").eq("customer_id", customerId).limit(1),
    ]);
    const activeRequest = requests.find((r) => ["requested", "accepted", "upcoming", "in_service"].includes(r.status)) ?? null;
    return {
      activeRequest,
      recentRequests: requests,
      recommendedCompanions: companions,
      trustedContact: contacts?.[0] ?? null,
    };
  } catch {
    return {
      activeRequest: null,
      recentRequests: [],
      recommendedCompanions: [],
      trustedContact: null,
    };
  }
}

export async function getOpenRequests(limit = 10): Promise<ServiceRequestView[]> {
  try {
    const supabase = await createClient();
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const { data: feedRows, error: feedError } = await supabase.rpc(
      "list_open_requests_for_companion",
      { result_limit: safeLimit },
    );

    if (!feedError && feedRows) {
      return (feedRows as (RequestRow & { customer_name: string })[]).map((row) => ({
        ...mapRequest(row),
        customerName: row.customer_name,
      }));
    }

    // Compatibility fallback while an existing Supabase project is waiting for
    // migration_open_request_feed.sql to be applied.
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at")
      .eq("status", "requested")
      .is("companion_id", null)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error("Open request feed failed", {
        rpcCode: feedError?.code,
        fallbackCode: error.code,
      });
      return [];
    }

    if (feedError) {
      console.warn("Open request RPC unavailable; using RLS fallback", {
        code: feedError.code,
      });
    }

    const requests = ((data ?? []) as RequestRow[]).map(mapRequest);
    const customerIds = [...new Set(requests.map((r) => r.customerId))];
    if (customerIds.length) {
      const { data: customers } = await supabase.from("profiles").select("id, full_name").in("id", customerIds);
      const names = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
      requests.forEach((r) => { r.customerName = names.get(r.customerId); });
    }
    return requests;
  } catch {
    return [];
  }
}

export async function getCompanionRequests(companionId: string): Promise<ServiceRequestView[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("service_requests")
      .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at")
      .eq("companion_id", companionId)
      .order("service_date", { ascending: true });

    const requests = ((data ?? []) as RequestRow[]).map(mapRequest);
    const customerIds = [...new Set(requests.map((request) => request.customerId))];
    if (customerIds.length) {
      const { data: customers } = await supabase.from("profiles").select("id, full_name").in("id", customerIds);
      const names = new Map((customers ?? []).map((customer) => [customer.id, customer.full_name]));
      requests.forEach((request) => { request.customerName = names.get(request.customerId); });
    }
    return requests;
  } catch {
    return [];
  }
}

export interface CustomerRequestHistoryItem extends ServiceRequestView {
  review?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

export async function getCustomerRequestsWithReviews(customerId: string): Promise<CustomerRequestHistoryItem[]> {
  try {
    const supabase = await createClient();
    const [{ data: requestsData }, { data: reviewsData }] = await Promise.all([
      supabase
        .from("service_requests")
        .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, request_id, rating, comment, created_at")
        .eq("customer_id", customerId),
    ]);

    const requests = ((requestsData ?? []) as RequestRow[]).map(mapRequest);
    const companionIds = [...new Set(requests.map((r) => r.companionId).filter(Boolean))] as string[];

    if (companionIds.length) {
      const { data: companions } = await supabase.from("profiles").select("id, full_name").in("id", companionIds);
      const companionMap = new Map((companions ?? []).map((c) => [c.id, c.full_name]));
      requests.forEach((r) => {
        if (r.companionId) r.companionName = companionMap.get(r.companionId);
      });
    }

    const reviewMap = new Map(
      (reviewsData ?? []).map((rev) => [
        rev.request_id,
        {
          id: rev.id,
          rating: Number(rev.rating),
          comment: rev.comment,
          createdAt: rev.created_at,
        },
      ]),
    );

    return requests.map((req) => ({
      ...req,
      review: reviewMap.get(req.id) ?? null,
    }));
  } catch (error) {
    console.error("getCustomerRequestsWithReviews error:", error);
    return [];
  }
}

export async function getCompanionDashboardData(companionId: string) {
  try {
    const supabase = await createClient();
    const [openRequests, myJobs, detailRes, reviewsRes, profileRes] = await Promise.all([
      getOpenRequests(5),
      getCompanionRequests(companionId),
      supabase.from("companion_details").select("*").eq("profile_id", companionId).maybeSingle(),
      supabase.from("reviews").select("rating").eq("companion_id", companionId),
      supabase.from("profiles").select("verification_status").eq("id", companionId).maybeSingle(),
    ]);

    const reviews = reviewsRes.data ?? [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : null;

    return {
      openRequests,
      myJobs,
      detail: detailRes.data,
      reviewCount: reviews.length,
      averageRating: avgRating,
      verificationStatus: (profileRes.data?.verification_status ?? "pending") as "pending" | "approved" | "rejected",
    };
  } catch {
    return {
      openRequests: [],
      myJobs: [],
      detail: null,
      reviewCount: 0,
      averageRating: null,
      verificationStatus: "pending" as const,
    };
  }
}

export interface CompanionProfileOwnerView {
  id: string;
  fullName: string;
  serviceArea: string;
  bio: string;
  verificationStatus: "pending" | "approved" | "rejected";
  experienceYears: number;
  skills: string[];
  languages: string[];
  hourlyRate: number;
  transportation: string;
  available: boolean;
}

export async function getCompanionProfileOwner(
  companionId: string,
): Promise<CompanionProfileOwnerView | null> {
  try {
    const supabase = await createClient();
    const [{ data: profile, error: profileError }, { data: detail, error: detailError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, service_area, bio, verification_status")
        .eq("id", companionId)
        .maybeSingle(),
      supabase
        .from("companion_details")
        .select("experience_years, skills, languages, hourly_rate, transportation, available")
        .eq("profile_id", companionId)
        .maybeSingle(),
    ]);

    if (profileError || detailError || !profile || profile.role !== "companion") return null;

    return {
      id: profile.id,
      fullName: profile.full_name,
      serviceArea: profile.service_area ?? "",
      bio: profile.bio ?? "",
      verificationStatus: profile.verification_status,
      experienceYears: detail?.experience_years ?? 0,
      skills: detail?.skills ?? [],
      languages: detail?.languages?.length ? detail.languages : ["ภาษาไทย"],
      hourlyRate: Number(detail?.hourly_rate ?? 300),
      transportation: detail?.transportation ?? "",
      available: detail?.available ?? false,
    };
  } catch {
    return null;
  }
}

export async function getRequestByReference(refOrId: string): Promise<ServiceRequestView | null> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("service_requests")
      .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at");

    if (/^CC-[A-Z0-9]{8}$/i.test(refOrId)) {
      query = query.eq("reference_no", refOrId);
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(refOrId)) {
      query = query.eq("id", refOrId);
    } else {
      return null;
    }

    const { data } = await query.maybeSingle();
    if (!data) return null;

    const request = mapRequest(data as RequestRow);
    if (request.companionId) {
      const { data: companion } = await supabase.from("profiles").select("full_name, service_area").eq("id", request.companionId).maybeSingle();
      request.companionName = companion?.full_name;
    }
    const { data: customer } = await supabase.from("profiles").select("full_name").eq("id", request.customerId).maybeSingle();
    request.customerName = customer?.full_name;
    return request;
  } catch {
    return null;
  }
}

export async function getRequestMessages(requestId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getAdminDashboardData() {
  try {
    const supabase = await createClient();
    const [
      { count: totalUsers },
      { count: verifiedCompanions },
      { count: pendingCompanions },
      { count: activeRequests },
      { count: completedRequests },
      { data: recentProfiles },
      { data: recentRequests },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "companion").eq("verification_status", "approved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "companion").eq("verification_status", "pending"),
      supabase.from("service_requests").select("*", { count: "exact", head: true }).in("status", ["requested", "accepted", "upcoming", "in_service"]),
      supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("profiles").select("id, full_name, role, verification_status, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("service_requests").select("id, reference_no, customer_id, category, service_date, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const customerIds = [...new Set((recentRequests ?? []).map((r) => r.customer_id))];
    let customerMap = new Map<string, string>();
    if (customerIds.length) {
      const { data: customers } = await supabase.from("profiles").select("id, full_name").in("id", customerIds);
      customerMap = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
    }

    return {
      stats: {
        totalUsers: totalUsers ?? 0,
        verifiedCompanions: verifiedCompanions ?? 0,
        pendingCompanions: pendingCompanions ?? 0,
        activeRequests: activeRequests ?? 0,
        completedRequests: completedRequests ?? 0,
      },
      recentProfiles: recentProfiles ?? [],
      recentRequests: (recentRequests ?? []).map((r) => ({
        ...r,
        customerName: customerMap.get(r.customer_id) ?? "ผู้ใช้บริการ",
      })),
    };
  } catch {
    return {
      stats: {
        totalUsers: 0,
        verifiedCompanions: 0,
        pendingCompanions: 0,
        activeRequests: 0,
        completedRequests: 0,
      },
      recentProfiles: [],
      recentRequests: [],
    };
  }
}

export interface CustomerProfileView {
  id: string;
  fullName: string;
  role: string;
  serviceArea: string;
  bio: string;
  phone: string;
  allergies: string;
  chronicDiseases: string;
  bloodType: string;
  mobilityAid: string;
  emergencyNote: string;
  familyContact: {
    id?: string;
    name: string;
    relationship: string;
    phone: string;
  } | null;
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfileView | null> {
  try {
    const supabase = await createClient();
    const [{ data: profile }, { data: contact }, { data: trustedList }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, service_area, bio").eq("id", userId).single(),
      supabase.from("profile_contacts").select("*").eq("profile_id", userId).maybeSingle(),
      supabase.from("trusted_contacts").select("id, name, relationship, phone").eq("customer_id", userId).limit(1),
    ]);

    if (!profile) return null;

    const trusted = trustedList?.[0] ?? null;

    let allergies = contact?.allergies ?? "";
    let chronicDiseases = contact?.chronic_diseases ?? "";
    let bloodType = contact?.blood_type ?? "";
    let mobilityAid = contact?.mobility_aid ?? "";
    let emergencyNote = contact?.emergency_note ?? "";

    if (emergencyNote && emergencyNote.startsWith("{") && emergencyNote.endsWith("}")) {
      try {
        const parsed = JSON.parse(emergencyNote);
        allergies = allergies || parsed.allergies || "";
        chronicDiseases = chronicDiseases || parsed.chronicDiseases || "";
        bloodType = bloodType || parsed.bloodType || "";
        mobilityAid = mobilityAid || parsed.mobilityAid || "";
        emergencyNote = parsed.emergencyNote || "";
      } catch {
        // keep as is
      }
    }

    return {
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      serviceArea: profile.service_area ?? "",
      bio: profile.bio ?? "",
      phone: contact?.phone ?? "",
      allergies,
      chronicDiseases,
      bloodType,
      mobilityAid,
      emergencyNote,
      familyContact: trusted ? {
        id: trusted.id,
        name: trusted.name,
        relationship: trusted.relationship,
        phone: trusted.phone,
      } : null,
    };
  } catch (error) {
    console.error("getCustomerProfile error:", error);
    return null;
  }
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  role: string;
  serviceArea: string;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  hourlyRate?: number;
  experienceYears?: number;
}

export interface AdminVerificationItem {
  id: string;
  fullName: string;
  serviceArea: string;
  bio: string;
  verificationStatus: string;
  createdAt: string;
  experienceYears: number;
  skills: string[];
  hourlyRate: number;
  documents: {
    id: string;
    documentType: string;
    status: string;
    reviewNote: string | null;
  }[];
}

export async function getAllUsersForAdmin(): Promise<AdminUserItem[]> {
  try {
    const supabase = await createClient();
    const [{ data: profiles }, { data: details }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, service_area, verification_status, is_active, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("companion_details")
        .select("profile_id, experience_years, hourly_rate"),
    ]);

    const detailMap = new Map((details ?? []).map((d) => [d.profile_id, d]));

    return (profiles ?? []).map((p) => {
      const d = detailMap.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name,
        role: p.role,
        serviceArea: p.service_area ?? "-",
        verificationStatus: p.verification_status,
        isActive: p.is_active ?? true,
        createdAt: p.created_at,
        hourlyRate: d ? Number(d.hourly_rate) : undefined,
        experienceYears: d?.experience_years,
      };
    });
  } catch (error) {
    console.error("getAllUsersForAdmin error:", error);
    return [];
  }
}

export async function getVerificationCompanionsForAdmin(): Promise<AdminVerificationItem[]> {
  try {
    const supabase = await createClient();
    const [{ data: profiles }, { data: details }, { data: docs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, service_area, bio, verification_status, created_at")
        .eq("role", "companion")
        .order("created_at", { ascending: false }),
      supabase
        .from("companion_details")
        .select("profile_id, experience_years, skills, hourly_rate"),
      supabase
        .from("verification_documents")
        .select("id, companion_id, document_type, status, review_note"),
    ]);

    const detailMap = new Map((details ?? []).map((d) => [d.profile_id, d]));
    const docMap = new Map<string, AdminVerificationItem["documents"]>();
    (docs ?? []).forEach((doc) => {
      const list = docMap.get(doc.companion_id) ?? [];
      list.push({
        id: doc.id,
        documentType: doc.document_type,
        status: doc.status,
        reviewNote: doc.review_note,
      });
      docMap.set(doc.companion_id, list);
    });

    return (profiles ?? []).map((p) => {
      const d = detailMap.get(p.id);
      return {
        id: p.id,
        fullName: p.full_name,
        serviceArea: p.service_area ?? "-",
        bio: p.bio ?? "",
        verificationStatus: p.verification_status,
        createdAt: p.created_at,
        experienceYears: d?.experience_years ?? 0,
        skills: d?.skills ?? [],
        hourlyRate: Number(d?.hourly_rate ?? 300),
        documents: docMap.get(p.id) ?? [],
      };
    });
  } catch (error) {
    console.error("getVerificationCompanionsForAdmin error:", error);
    return [];
  }
}

export async function getAllRequestsForAdmin(): Promise<ServiceRequestView[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("service_requests")
      .select("id, reference_no, customer_id, companion_id, category, service_date, start_time, duration_hours, pickup, pickup_latitude, pickup_longitude, pickup_accuracy_meters, destination, support_needs, notes, status, created_at")
      .order("created_at", { ascending: false });

    const requests = ((data ?? []) as RequestRow[]).map(mapRequest);
    const userIds = [...new Set([
      ...requests.map((r) => r.customerId),
      ...(requests.map((r) => r.companionId).filter(Boolean) as string[]),
    ])];

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      requests.forEach((r) => {
        r.customerName = nameMap.get(r.customerId) ?? "ผู้ใช้บริการ";
        if (r.companionId) r.companionName = nameMap.get(r.companionId);
      });
    }

    return requests;
  } catch (error) {
    console.error("getAllRequestsForAdmin error:", error);
    return [];
  }
}

export interface AdminSettingsData {
  tableCounts: {
    profiles: number;
    companions: number;
    requests: number;
    messages: number;
    reviews: number;
    documents: number;
  };
  envStatus: {
    hasSupabaseUrl: boolean;
    hasPublishableKey: boolean;
    nodeEnv: string;
  };
}

export async function getAdminSettingsData(): Promise<AdminSettingsData> {
  try {
    const supabase = await createClient();
    const [
      { count: profilesCount },
      { count: companionsCount },
      { count: requestsCount },
      { count: messagesCount },
      { count: reviewsCount },
      { count: documentsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("companion_details").select("*", { count: "exact", head: true }),
      supabase.from("service_requests").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("verification_documents").select("*", { count: "exact", head: true }),
    ]);

    return {
      tableCounts: {
        profiles: profilesCount ?? 0,
        companions: companionsCount ?? 0,
        requests: requestsCount ?? 0,
        messages: messagesCount ?? 0,
        reviews: reviewsCount ?? 0,
        documents: documentsCount ?? 0,
      },
      envStatus: {
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
        nodeEnv: process.env.NODE_ENV || "development",
      },
    };
  } catch (error) {
    console.error("getAdminSettingsData error:", error);
    return {
      tableCounts: {
        profiles: 0,
        companions: 0,
        requests: 0,
        messages: 0,
        reviews: 0,
        documents: 0,
      },
      envStatus: {
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
        nodeEnv: process.env.NODE_ENV || "development",
      },
    };
  }
}


