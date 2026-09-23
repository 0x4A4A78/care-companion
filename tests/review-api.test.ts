import { describe, expect, it } from "vitest";
import { createReviewSchema } from "../lib/review-schema";

describe("Review Schema Validation", () => {
  it("accepts valid review input", () => {
    const valid = {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
      comment: "ผู้ช่วยสุภาพและบริการดีมากครับ",
    };
    const result = createReviewSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts valid review without comment", () => {
    const valid = {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 4,
    };
    const result = createReviewSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid rating outside 1-5", () => {
    const invalidLow = {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 0,
    };
    expect(createReviewSchema.safeParse(invalidLow).success).toBe(false);

    const invalidHigh = {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 6,
    };
    expect(createReviewSchema.safeParse(invalidHigh).success).toBe(false);
  });

  it("rejects non-uuid requestId", () => {
    const invalidUuid = {
      requestId: "invalid-id",
      rating: 5,
    };
    expect(createReviewSchema.safeParse(invalidUuid).success).toBe(false);
  });

  it("rejects comment exceeding 1000 characters", () => {
    const longComment = {
      requestId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
      comment: "ก".repeat(1001),
    };
    expect(createReviewSchema.safeParse(longComment).success).toBe(false);
  });
});
