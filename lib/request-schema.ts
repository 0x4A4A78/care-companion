import { z } from "zod";

export const serviceRequestSchema = z
  .object({
    category: z.enum([
      "hospital",
      "bank",
      "government",
      "shopping",
      "other",
    ], { message: "กรุณาเลือกประเภทธุระ" }),
    serviceDate: z.iso.date({ message: "กรุณาระบุวันที่ใช้บริการให้ถูกต้อง" }),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "กรุณาระบุเวลาในรูปแบบ 00:00 - 23:59"),
    durationHours: z.number().min(0.5, "ระยะเวลาต้องไม่น้อยกว่า 30 นาที").max(12, "ระยะเวลาต้องไม่เกิน 12 ชั่วโมง"),
    pickup: z.string().trim().min(3, "สถานที่ต้นทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร").max(300),
    destination: z.string().trim().min(3, "จุดหมายปลายทางต้องมีความยาวอย่างน้อย 3 ตัวอักษร").max(300),
    supportNeeds: z.array(z.string().trim().min(1).max(100)).max(8),
    notes: z.string().trim().max(1000, "รายละเอียดเพิ่มเติมต้องไม่เกิน 1,000 ตัวอักษร"),
  })
  .refine((value) => value.pickup.trim().toLowerCase() !== value.destination.trim().toLowerCase(), {
    message: "สถานที่ต้นทางและปลายทางต้องไม่เหมือนกัน",
    path: ["destination"],
  });

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
