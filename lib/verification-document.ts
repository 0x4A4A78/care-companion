export const verificationDocumentLabels = {
  id_card: "บัตรประชาชนหรือเอกสารระบุตัวตน",
  criminal_record: "เอกสารตรวจสอบประวัติ",
  other: "เอกสารประกอบอื่น ๆ",
} as const;

const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

const maxFileSize = 5 * 1024 * 1024;

export function validateVerificationDocument(documentType: string, file: File) {
  if (!(documentType in verificationDocumentLabels)) {
    return { ok: false as const, error: "ประเภทเอกสารไม่ถูกต้อง" };
  }
  const extension = fileExtensions[file.type];
  if (!extension) {
    return { ok: false as const, error: "รองรับเฉพาะไฟล์ JPG, PNG หรือ PDF" };
  }
  if (file.size <= 0) {
    return { ok: false as const, error: "ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ใหม่" };
  }
  if (file.size > maxFileSize) {
    return { ok: false as const, error: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" };
  }
  return { ok: true as const, extension };
}
