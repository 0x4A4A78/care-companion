/**
 * parseVoiceIntent — วิเคราะห์ข้อความเสียงภาษาไทยแล้วแปลงเป็นข้อมูลคำขอบริการ
 * ไม่ต้องใช้ AI API ภายนอก — ใช้ keyword matching + regex
 */

export interface VoiceIntent {
  category?: "hospital" | "bank" | "government" | "shopping" | "other";
  destination?: string;
  pickup?: string;
  serviceDate?: string;        // yyyy-MM-dd
  startTime?: string;          // HH:mm
  durationHours?: number;
  supportNeeds?: string[];
  notes?: string;
  raw: string;                 // ข้อความดิบที่ได้จาก speech recognition
}

/* ─── Category keywords ─── */
const categoryMap: [string[], VoiceIntent["category"]][] = [
  [["โรงพยาบาล", "หมอ", "แพทย์", "คลินิก", "ตรวจ", "นัดหมอ", "พบแพทย์", "รพ."], "hospital"],
  [["ธนาคาร", "แบงค์", "แบงก์", "กสิกร", "กรุงไทย", "ไทยพาณิชย์", "กรุงเทพ", "ออมสิน", "ทหารไทย"], "bank"],
  [["ราชการ", "อำเภอ", "ที่ว่าการ", "สำนักงานเขต", "ประกันสังคม", "กรม", "ทะเบียน", "บัตรประชาชน", "พาสปอร์ต"], "government"],
  [["ซื้อของ", "ตลาด", "ห้าง", "ซุปเปอร์", "ซูเปอร์", "โลตัส", "บิ๊กซี", "แม็คโคร", "เซเว่น", "ช้อปปิ้ง", "ซื้อสินค้า"], "shopping"],
];

/* ─── Known places for destination extraction ─── */
const knownPlaces: [string[], string][] = [
  // hospitals
  [["ศิริราช"], "โรงพยาบาลศิริราช"],
  [["รามา", "รามาธิบดี"], "โรงพยาบาลรามาธิบดี"],
  [["จุฬา", "จุฬาลงกรณ์"], "โรงพยาบาลจุฬาลงกรณ์"],
  [["ราชวิถี"], "โรงพยาบาลราชวิถี"],
  [["พระมงกุฎ"], "โรงพยาบาลพระมงกุฎเกล้า"],
  [["บำรุงราษฎร์"], "โรงพยาบาลบำรุงราษฎร์"],
  [["กรุงเทพ"], "โรงพยาบาลกรุงเทพ"],
  // banks
  [["กสิกร", "กสิกรไทย"], "ธนาคารกสิกรไทย"],
  [["กรุงไทย"], "ธนาคารกรุงไทย"],
  [["ไทยพาณิชย์"], "ธนาคารไทยพาณิชย์"],
  [["ออมสิน"], "ธนาคารออมสิน"],
  // general
  [["ตลาด"], "ตลาด"],
  [["ห้าง", "ห้างสรรพสินค้า"], "ห้างสรรพสินค้า"],
  [["โลตัส"], "โลตัส"],
  [["บิ๊กซี"], "บิ๊กซี"],
];

/* ─── Support needs keywords ─── */
const supportMap: [string[], string][] = [
  [["เดิน", "เพื่อน", "ไปด้วย", "ไปเป็นเพื่อน"], "เดินเป็นเพื่อน"],
  [["ถือของ", "ช่วยถือ", "หิ้ว"], "ช่วยถือของชิ้นเล็ก"],
  [["เอกสาร", "ขั้นตอน", "กรอก", "เตรียม"], "ช่วยดูขั้นตอนและเอกสาร"],
  [["รถเข็น", "วีลแชร์", "wheelchair"], "ช่วยใช้รถเข็น"],
  [["รอ", "รอคิว", "เสร็จ"], "รอเป็นเพื่อนจนเสร็จธุระ"],
];

/* ─── Time parsing helpers ─── */

function parseDateFromText(text: string): string | undefined {
  const today = new Date();

  if (/วันนี้/.test(text)) {
    return fmt(today);
  }
  if (/พรุ่งนี้/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return fmt(d);
  }
  if (/มะรืน/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return fmt(d);
  }

  // วันจันทร์, วันอังคาร, ...
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  for (let i = 0; i < dayNames.length; i++) {
    if (text.includes(dayNames[i])) {
      const d = new Date(today);
      const diff = (i - d.getDay() + 7) % 7 || 7; // ถ้าวันเดียวกัน ให้เป็นสัปดาห์หน้า
      d.setDate(d.getDate() + diff);
      return fmt(d);
    }
  }

  return undefined;
}

function parseTimeFromText(text: string): string | undefined {
  // "9 โมง", "เก้าโมง", "บ่ายสองโมง"
  const thaiNums: Record<string, number> = {
    "หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5, "หก": 6,
    "เจ็ด": 7, "แปด": 8, "เก้า": 9, "สิบ": 10, "สิบเอ็ด": 11,
  };

  // "ตอนเช้า" default
  if (/ตอนเช้า/.test(text) && !(/\d/.test(text) || Object.keys(thaiNums).some(k => text.includes(k + "โมง")))) {
    return "09:00";
  }
  if (/ตอนบ่าย/.test(text) && !(/\d/.test(text) || Object.keys(thaiNums).some(k => text.includes(k + "โมง")))) {
    return "13:00";
  }
  if (/ตอนเย็น/.test(text)) {
    return "17:00";
  }

  // "บ่าย X โมง"
  const pmMatch = text.match(/บ่าย\s*(\d+|หนึ่ง|สอง|สาม|สี่|ห้า)\s*โมง/);
  if (pmMatch) {
    const n = thaiNums[pmMatch[1]] ?? parseInt(pmMatch[1], 10);
    if (n >= 1 && n <= 5) return `${(n + 12).toString().padStart(2, "0")}:00`;
  }

  // "X โมง" (เช้า)
  const amMatch = text.match(/(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|สิบเอ็ด)\s*โมง/);
  if (amMatch) {
    const n = thaiNums[amMatch[1]] ?? parseInt(amMatch[1], 10);
    if (n >= 1 && n <= 12) {
      // ถ้ามีคำว่า "เช้า" หรือเลข 6-11 → เช้า
      // ถ้ามีคำว่า "บ่าย" → บ่าย (handled above)
      const hour = n <= 5 && !/เช้า/.test(text) ? n + 12 : n < 6 ? n + 6 : n;
      return `${hour.toString().padStart(2, "0")}:00`;
    }
  }

  return undefined;
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/* ─── Main parser ─── */

export function parseVoiceIntent(text: string): VoiceIntent {
  const raw = text.trim();
  if (!raw) return { raw };

  const lower = raw;

  // Category
  let category: VoiceIntent["category"] = undefined;
  for (const [keywords, cat] of categoryMap) {
    if (keywords.some(k => lower.includes(k))) {
      category = cat;
      break;
    }
  }

  // Destination
  let destination: string | undefined;
  for (const [keywords, place] of knownPlaces) {
    if (keywords.some(k => lower.includes(k))) {
      destination = place;
      break;
    }
  }

  // Support needs
  const supportNeeds: string[] = [];
  for (const [keywords, need] of supportMap) {
    if (keywords.some(k => lower.includes(k))) {
      supportNeeds.push(need);
    }
  }

  // Date & time
  const serviceDate = parseDateFromText(lower);
  const startTime = parseTimeFromText(lower);

  return {
    category: category ?? "other",
    destination,
    serviceDate,
    startTime,
    supportNeeds: supportNeeds.length > 0 ? supportNeeds : undefined,
    raw,
  };
}
