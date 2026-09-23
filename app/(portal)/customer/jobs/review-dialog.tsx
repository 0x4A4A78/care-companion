"use client";

import { MessageSquare, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ReviewDialogProps {
  requestId: string;
  referenceNo: string;
  companionName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ratingLabels: Record<number, string> = {
  1: "ต้องปรับปรุง",
  2: "พอใช้",
  3: "ปานกลาง",
  4: "ดีมาก บริการประทับใจ",
  5: "ยอดเยี่ยม อุ่นใจและประทับใจมาก",
};

export function ReviewDialog({
  requestId,
  referenceNo,
  companionName = "ผู้ช่วยร่วมเดินทาง",
  onClose,
  onSuccess,
}: ReviewDialogProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("กรุณาเลือกคะแนนดาว 1–5 ดาว");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกคะแนนได้");
      }

      toast.success("บันทึกคะแนนรีวิวเรียบร้อยแล้ว", {
        description: `ขอบคุณที่ให้คะแนนการบริการของ ${companionName}`,
      });

      onSuccess?.();
      router.refresh();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="review-dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="review-dialog-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-dialog-header">
          <div>
            <h3>ให้คะแนนและรีวิวผู้ช่วย</h3>
            <p>คำขอ {referenceNo} · {companionName}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-dialog-form">
          <div className="star-rating-box">
            <span className="star-rating-title">ระดับความพึงพอใจ</span>
            <div className="star-buttons-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-pick-btn ${star <= activeRating ? "active" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} ดาว`}
                >
                  <Star
                    size={32}
                    fill={star <= activeRating ? "#f59e0b" : "none"}
                    color={star <= activeRating ? "#f59e0b" : "#cbd5e1"}
                  />
                </button>
              ))}
            </div>
            <span className="star-rating-label">
              {ratingLabels[activeRating] || "เลือกคะแนนดาว"}
            </span>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span style={{ fontWeight: 650, display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={16} /> ความคิดเห็นหรือข้อเสนอแนะ (ถ้ามี)
            </span>
            <textarea
              rows={3}
              placeholder={`บอกเล่าความประทับใจเกี่ยวกับ ${companionName} เช่น ความตรงต่อเวลา ความสุภาพ หรือการดูแล...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <small style={{ color: "var(--muted)", textAlign: "right" }}>
              {comment.length}/1,000 ตัวอักษร
            </small>
          </label>

          <div className="review-dialog-actions">
            <button
              type="button"
              className="button button-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={submitting}
            >
              {submitting ? "กำลังบันทึก..." : "ส่งคะแนนรีวิว"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
