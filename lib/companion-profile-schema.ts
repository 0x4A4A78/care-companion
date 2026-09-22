import { z } from "zod";

const normalizedList = (maxItems: number) => z
  .array(z.string().trim().max(100))
  .max(maxItems)
  .transform((values) => [...new Set(values.filter(Boolean))]);

export const companionProfileSchema = z.object({
  fullName: z.string().trim().min(1, "กรุณาระบุชื่อ-นามสกุล").max(120),
  serviceArea: z.string().trim().max(300),
  bio: z.string().trim().max(1000),
  experienceYears: z.coerce.number().int().min(0).max(60),
  skills: normalizedList(12),
  languages: normalizedList(8).refine((values) => values.length > 0, {
    message: "กรุณาระบุภาษาอย่างน้อยหนึ่งภาษา",
  }),
  hourlyRate: z.coerce.number().min(0).max(10000),
  transportation: z.string().trim().max(300),
  available: z.boolean(),
});

export type CompanionProfileInput = z.infer<typeof companionProfileSchema>;
