export const serviceCategoryLabel = {
  hospital: "ไปพบแพทย์ / โรงพยาบาล",
  bank: "ไปธนาคาร",
  government: "ติดต่อราชการ",
  shopping: "ซื้อสินค้า",
  other: "ธุระอื่น ๆ",
} as const;

export function formatThaiDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+07:00`));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(value);
}
