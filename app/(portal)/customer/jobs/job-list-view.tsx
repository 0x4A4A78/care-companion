"use client";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Card } from "../../../../components/ui";
import { formatThaiDate, serviceCategoryLabel } from "../../../../lib/data/presentation";
import type { CustomerRequestHistoryItem } from "../../../../lib/data/queries";
import { serviceStatusLabel } from "../../../../lib/service-status";
import { ReviewDialog } from "./review-dialog";

export function CustomerJobListView({
  initialJobs,
}: {
  initialJobs: CustomerRequestHistoryItem[];
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedReviewJob, setSelectedReviewJob] = useState<CustomerRequestHistoryItem | null>(null);

  const activeJobs = jobs.filter((job) =>
    ["requested", "accepted", "upcoming", "in_service"].includes(job.status),
  );
  const historyJobs = jobs.filter((job) =>
    ["completed", "cancelled"].includes(job.status),
  );

  function handleReviewSuccess(requestId: string, rating: number, comment?: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === requestId
          ? {
              ...j,
              review: {
                id: "new-review",
                rating,
                comment: comment || null,
                createdAt: new Date().toISOString(),
              },
            }
          : j,
      ),
    );
  }

  const renderActiveCard = (job: CustomerRequestHistoryItem) => (
    <Card key={job.id} className="customer-job-card">
      <div className="customer-job-header">
        <div>
          <Badge
            tone={
              job.status === "cancelled"
                ? "red"
                : job.status === "completed"
                  ? "green"
                  : "blue"
            }
          >
            {serviceStatusLabel[job.status]}
          </Badge>
          <h3>
            {serviceCategoryLabel[job.category] ?? job.category} · {job.referenceNo}
          </h3>
        </div>
        <Link
          href={`/customer/jobs/${job.referenceNo}`}
          className="button button-primary"
          style={{ minHeight: 44, padding: "8px 18px", fontSize: ".92rem" }}
        >
          <MessageCircle size={17} /> ติดตามและแชต
        </Link>
      </div>

      <div className="customer-job-meta">
        <p>
          <CalendarDays size={16} /> {formatThaiDate(job.serviceDate)} เวลา {job.startTime} น.
        </p>
        <p>
          <MapPin size={16} /> {job.pickup} ➔ {job.destination}
        </p>
        {job.companionName ? (
          <p className="customer-job-companion">
            <UserRound size={16} /> ผู้ช่วย: <strong>{job.companionName}</strong>
          </p>
        ) : (
          <p className="customer-job-companion searching">
            <UserRound size={16} /> กำลังค้นหาผู้ช่วยที่เหมาะสม...
          </p>
        )}
      </div>
    </Card>
  );

  const renderHistoryCard = (job: CustomerRequestHistoryItem) => (
    <Card key={job.id} className="customer-job-card history">
      <div className="customer-job-header">
        <div>
          <Badge
            tone={
              job.status === "completed"
                ? "green"
                : "red"
            }
          >
            {serviceStatusLabel[job.status]}
          </Badge>
          <h3>
            {serviceCategoryLabel[job.category] ?? job.category} · {job.referenceNo}
          </h3>
        </div>
        <Link
          href={`/customer/jobs/${job.referenceNo}`}
          className="button button-ghost"
          style={{ minHeight: 40, padding: "6px 14px", fontSize: ".88rem" }}
        >
          ดูรายละเอียด
        </Link>
      </div>

      <div className="customer-job-meta">
        <p>
          <CalendarDays size={16} /> {formatThaiDate(job.serviceDate)} เวลา {job.startTime} น. ({job.durationHours} ชม.)
        </p>
        <p>
          <MapPin size={16} /> {job.pickup} ➔ {job.destination}
        </p>
        {job.companionName && (
          <p className="customer-job-companion">
            <UserRound size={16} /> ผู้ช่วย: <strong>{job.companionName}</strong>
          </p>
        )}
      </div>

      {/* Review & Rating Section for Completed Jobs */}
      {job.status === "completed" && job.companionId && (
        <div className="customer-job-review-box">
          {job.review ? (
            <div className="reviewed-summary">
              <div className="reviewed-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= job.review!.rating ? "#f59e0b" : "none"}
                    color={star <= job.review!.rating ? "#f59e0b" : "#cbd5e1"}
                  />
                ))}
                <span className="reviewed-score">{job.review.rating}/5 ดาว</span>
                <span className="reviewed-badge">
                  <CheckCircle2 size={14} /> ให้คะแนนแล้ว
                </span>
              </div>
              {job.review.comment && (
                <p className="reviewed-comment">
                  &ldquo;{job.review.comment}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="unreviewed-prompt">
              <span>ท่านยังไม่ได้ให้คะแนนการบริการนี้</span>
              <button
                type="button"
                className="button button-primary rate-companion-btn"
                onClick={() => setSelectedReviewJob(job)}
              >
                <Star size={16} fill="#fff" /> ให้คะแนนผู้ช่วย
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>งานและประวัติของฉัน</h1>
          <p>ติดตามงานที่กำลังดำเนินการ และดูประวัติการเดินทางพร้อมให้คะแนนผู้ช่วย</p>
        </div>
        <Link
          href="/customer/request"
          className="button button-primary"
        >
          <Plus size={18} /> ขอผู้ช่วยเดินทาง
        </Link>
      </div>

      <section className="stack" style={{ gap: 28 }}>
        {/* Active Jobs */}
        <div>
          <div className="section-title">
            <h2>งานที่กำลังดำเนินการ ({activeJobs.length})</h2>
          </div>
          {activeJobs.length > 0 ? (
            <div className="stack" style={{ gap: 14 }}>
              {activeJobs.map(renderActiveCard)}
            </div>
          ) : (
            <Card className="form-card empty-state" style={{ textAlign: "center", padding: "32px 20px" }}>
              <ClipboardList size={36} style={{ color: "var(--muted)", margin: "0 auto 10px" }} />
              <p style={{ color: "var(--muted)", margin: 0 }}>ไม่มีงานที่กำลังดำเนินการในขณะนี้</p>
            </Card>
          )}
        </div>

        {/* History Jobs */}
        <div>
          <div className="section-title">
            <h2>ประวัติการใช้บริการ ({historyJobs.length})</h2>
          </div>
          {historyJobs.length > 0 ? (
            <div className="stack" style={{ gap: 14 }}>
              {historyJobs.map(renderHistoryCard)}
            </div>
          ) : (
            <Card className="form-card empty-state" style={{ textAlign: "center", padding: "32px 20px" }}>
              <ClipboardList size={36} style={{ color: "var(--muted)", margin: "0 auto 10px" }} />
              <p style={{ color: "var(--muted)", margin: 0 }}>ยังไม่มีประวัติการใช้บริการที่ผ่านมา</p>
            </Card>
          )}
        </div>
      </section>

      {/* Review Dialog */}
      {selectedReviewJob && (
        <ReviewDialog
          requestId={selectedReviewJob.id}
          referenceNo={selectedReviewJob.referenceNo}
          companionName={selectedReviewJob.companionName}
          onClose={() => setSelectedReviewJob(null)}
          onSuccess={() => {
            // Updated in state
            if (selectedReviewJob) {
              handleReviewSuccess(selectedReviewJob.id, 5);
            }
          }}
        />
      )}
    </>
  );
}
