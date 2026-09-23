import { z } from "zod";

export const createReviewSchema = z.object({
  requestId: z.string().uuid("รหัสงานไม่ถูกต้อง"),
  rating: z.number().int().min(1, "กรุณาให้คะแนนอย่างน้อย 1 ดาว").max(5, "คะแนนสูงสุดคือ 5 ดาว"),
  comment: z
    .string()
    .trim()
    .max(1000, "ความคิดเห็นต้องไม่เกิน 1,000 ตัวอักษร")
    .optional()
    .or(z.literal("")),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
