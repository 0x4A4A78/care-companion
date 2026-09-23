"use client";

import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { Card } from "../../../../../components/ui";
import { ReviewDialog } from "../review-dialog";

export function JobDetailReviewSection({
  requestId,
  referenceNo,
  companionName,
  initialReview,
}: {
  requestId: string;
  referenceNo: string;
  companionName?: string;
  initialReview?: { rating: number; comment: string | null } | null;
}) {
  const [review, setReview] = useState(initialReview);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <Card className="form-card" style={{ marginTop: 20 }}>
      <h2>การประเมินความพึงพอใจ</h2>
      {review ? (
        <div className="reviewed-summary" style={{ marginTop: 12 }}>
          <div className="reviewed-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={star <= review.rating ? "#f59e0b" : "none"}
                color={star <= review.rating ? "#f59e0b" : "#cbd5e1"}
              />
            ))}
            <span className="reviewed-score" style={{ fontSize: "1.05rem" }}>
              {review.rating}/5 ดาว
            </span>
            <span className="reviewed-badge">
              <CheckCircle2 size={14} /> ให้คะแนนแล้ว
            </span>
          </div>
          {review.comment && (
            <p className="reviewed-comment" style={{ marginTop: 10, fontSize: "1rem" }}>
              &ldquo;{review.comment}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <p style={{ color: "var(--muted)", margin: "0 0 14px" }}>
            บริการเสร็จสิ้นแล้ว ร่วมประเมินและให้ข้อเสนอแนะแก่ {companionName ?? "ผู้ช่วย"} เพื่อพัฒนาการบริการ
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowDialog(true)}
          >
            <Star size={18} fill="#fff" /> ให้คะแนนผู้ช่วย
          </button>
        </div>
      )}

      {showDialog && (
        <ReviewDialog
          requestId={requestId}
          referenceNo={referenceNo}
          companionName={companionName}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setReview({ rating: 5, comment: null });
          }}
        />
      )}
    </Card>
  );
}
