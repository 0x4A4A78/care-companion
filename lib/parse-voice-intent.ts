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

/* ─── Date & time parsing helpers ─── */

const thaiNumberWords: Record<string, number> = {
  "ศูนย์": 0, "หนึ่ง": 1, "เอ็ด": 1, "สอง": 2, "สาม": 3, "สี่": 4,
  "ห้า": 5, "หก": 6, "เจ็ด": 7, "แปด": 8, "เก้า": 9, "สิบ": 10,
  "สิบเอ็ด": 11, "สิบสอง": 12,
};

function parseThaiNumber(value: string): number | undefined {
  const normalized = value.replace(/\s+/g, "");
  if (/^\d{1,2}$/.test(normalized)) return Number(normalized);
  if (normalized in thaiNumberWords) return thaiNumberWords[normalized];
  if (normalized.startsWith("ยี่สิบ")) {
    const unit = normalized.slice("ยี่สิบ".length);
    return unit ? 20 + (thaiNumberWords[unit] ?? Number.NaN) : 20;
  }
  if (normalized.startsWith("สามสิบ")) {
    const unit = normalized.slice("สามสิบ".length);
    return unit ? 30 + (thaiNumberWords[unit] ?? Number.NaN) : 30;
  }
  if (normalized.startsWith("สิบ")) {
    const unit = normalized.slice("สิบ".length);
    return unit ? 10 + (thaiNumberWords[unit] ?? Number.NaN) : 10;
  }
  return undefined;
}

function bangkokDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function calendarDate(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addCalendarDays(base: { year: number; month: number; day: number }, amount: number) {
  const date = new Date(Date.UTC(base.year, base.month - 1, base.day + amount));
  return calendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function parseDateFromText(text: string, referenceDate: Date): string | undefined {
  const today = bangkokDateParts(referenceDate);

  if (/วันนี้/.test(text)) {
    return calendarDate(today.year, today.month, today.day);
  }
  if (/พรุ่งนี้/.test(text)) {
    return addCalendarDays(today, 1);
  }
  const relativeMatch = text.match(/อีก\s*([ก-๙\d]+?)\s*วัน/);
  if (relativeMatch) {
    const amount = parseThaiNumber(relativeMatch[1]);
    if (amount !== undefined && amount >= 0 && amount <= 60) return addCalendarDays(today, amount);
  }

  const slashDate = text.match(/(?:วันที่?\s*)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (slashDate) {
    const day = Number(slashDate[1]);
    const month = Number(slashDate[2]);
    let year = slashDate[3] ? Number(slashDate[3]) : today.year;
    if (year > 2400) year -= 543;
    if (year < 100) year += 2000;
    let result = calendarDate(year, month, day);
    if (result && !slashDate[3] && result < calendarDate(today.year, today.month, today.day)!) {
      result = calendarDate(year + 1, month, day);
    }
    return result;
  }

  const dayOfMonthMatch = text.match(/วันที่\s*(\d{1,2})/);
  if (dayOfMonthMatch) {
    const requestedDay = Number(dayOfMonthMatch[1]);
    let year = today.year;
    let month = today.month;
    let result = calendarDate(year, month, requestedDay);
    const todayValue = calendarDate(today.year, today.month, today.day)!;
    if (!result || result < todayValue) {
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      result = calendarDate(year, month, requestedDay);
    }
    return result;
  }

  // วันจันทร์, วันอังคาร, ...
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  for (let i = 0; i < dayNames.length; i++) {
    if (text.includes(dayNames[i])) {
      const base = new Date(Date.UTC(today.year, today.month - 1, today.day));
      const diff = (i - base.getUTCDay() + 7) % 7 || 7;
      return addCalendarDays(today, diff);
    }
  }

  return undefined;
}

function parseTimeFromText(text: string): string | undefined {
  const colonTime = text.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)(?:\s|$)/);
  if (colonTime) return `${String(Number(colonTime[1])).padStart(2, "0")}:${colonTime[2]}`;

  if (/เที่ยงคืน/.test(text)) return "00:00";
  if (/เที่ยงครึ่ง/.test(text)) return "12:30";
  if (/เที่ยง/.test(text)) return "12:00";

  // "ตอนเช้า" default
  if (/ตอนเช้า/.test(text) && !(/\d/.test(text) || Object.keys(thaiNumberWords).some(k => text.includes(k + "โมง")))) {
    return "09:00";
  }
  if (/ตอนบ่าย/.test(text) && !(/\d/.test(text) || Object.keys(thaiNumberWords).some(k => text.includes(k + "โมง")))) {
    return "13:00";
  }
  if (/ตอนเย็น/.test(text)) {
    return "17:00";
  }

  // "บ่าย X โมง"
  const pmMatch = text.match(/บ่าย\s*(\d{1,2}|หนึ่ง|สอง|สาม|สี่|ห้า)(?:\s*โมง)?/);
  if (pmMatch) {
    const n = parseThaiNumber(pmMatch[1]);
    if (n && n >= 1 && n <= 5) return `${String(n + 12).padStart(2, "0")}:00`;
  }

  const earlyMatch = text.match(/ตี\s*(\d{1,2}|หนึ่ง|สอง|สาม|สี่|ห้า)/);
  if (earlyMatch) {
    const n = parseThaiNumber(earlyMatch[1]);
    if (n && n >= 1 && n <= 5) return `${String(n).padStart(2, "0")}:00`;
  }

  const eveningMatch = text.match(/(\d{1,2}|หนึ่ง|สอง|สาม|สี่|ห้า)\s*ทุ่ม/);
  if (eveningMatch) {
    const n = parseThaiNumber(eveningMatch[1]);
    if (n && n >= 1 && n <= 5) return `${String(n + 18).padStart(2, "0")}:00`;
  }

  // "X โมง", "สิบโมงครึ่ง", "6 โมงเย็น"
  const amMatch = text.match(/(\d{1,2}|สิบเอ็ด|สิบสอง|สิบ|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า)\s*โมง\s*(ครึ่ง)?\s*(เช้า|เย็น)?/);
  if (amMatch) {
    const n = parseThaiNumber(amMatch[1]);
    if (n && n >= 1 && n <= 12) {
      const period = amMatch[3];
      const hour = period === "เย็น" ? (n < 12 ? n + 12 : n) : period === "เช้า" ? n : n <= 5 ? n + 12 : n;
      return `${String(hour).padStart(2, "0")}:${amMatch[2] ? "30" : "00"}`;
    }
  }

  return undefined;
}

/* ─── Main parser ─── */

export function parseVoiceIntent(text: string, referenceDate = new Date()): VoiceIntent {
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
  const serviceDate = parseDateFromText(lower, referenceDate);
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
