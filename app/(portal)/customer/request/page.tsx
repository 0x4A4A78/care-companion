"use client";

import {
  ArrowLeft,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CircleEllipsis,
  Clock,
  Landmark,
  MapPin,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  ShoppingBag,
  Stethoscope,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Card } from "../../../../components/ui";
import { formatMoney, formatThaiDate } from "../../../../lib/data/presentation";
import { buildGoogleTtsUrl, findPreferredThaiVoice } from "../../../../lib/google-tts";
import {
  formatTime24HourInput,
  getConversationVoicePatch,
  isValidTime24Hour,
  type ConversationStep,
} from "../../../../lib/request-conversation";
import { serviceRequestSchema } from "../../../../lib/request-schema";

const LocationPickerMap = dynamic(() => import("../../../../components/location-picker-map"), {
  ssr: false,
  loading: () => <div className="location-map-loading">กำลังเปิดแผนที่...</div>,
});

const categories = [
  { id: "hospital", label: "ไปพบแพทย์ / โรงพยาบาล", Icon: Stethoscope },
  { id: "bank", label: "ไปธนาคาร", Icon: Landmark },
  { id: "government", label: "ติดต่อราชการ", Icon: Building2 },
  { id: "shopping", label: "ซื้อสินค้า / จ่ายตลาด", Icon: ShoppingBag },
  { id: "other", label: "ธุระอื่น ๆ", Icon: CircleEllipsis },
] as const;

const steps: { id: ConversationStep; question: string; hint: string }[] = [
  {
    id: "category",
    question: "สวัสดีครับคุณตาคุณยาย วันนี้ต้องการให้ผู้ช่วยพาไปทำธุระอะไรครับ?",
    hint: "กดเลือกจากปุ่มตัวเลือก หรือพิมพ์ข้อความบอกน้องแคร์ด้านล่างได้เลยครับ",
  },
  {
    id: "datetime",
    question: "ต้องการให้ผู้ช่วยไปพบในวันไหน และเวลาประมาณกี่โมงครับ?",
    hint: "พิมพ์คุยได้เลย เช่น 'อีก 3 วัน 10 โมงเช้า', 'พรุ่งนี้บ่ายสอง' หรือ 'วันที่ 28 เวลา 10 โมง' ครับ",
  },
  {
    id: "pickup",
    question: "ให้ผู้ช่วยเดินทางไปรับที่ไหนครับ?",
    hint: "พิมพ์ชื่อบ้าน ซอย หรือจุดสังเกต หรือกดเปิดแผนที่เพื่อแชร์ตำแหน่งและปักหมุดได้เลยครับ",
  },
  {
    id: "destination",
    question: "จุดหมายปลายทางที่จะเดินทางไปคือที่ไหนครับ?",
    hint: "พิมพ์ชื่อโรงพยาบาล ห้าง หรือสถานที่ปลายทางได้เลยครับ",
  },
  {
    id: "duration",
    question: "คาดว่าจะใช้เวลาทำธุระประมาณกี่ชั่วโมงดีครับ?",
    hint: "กดเลือกจำนวนชั่วโมงด้านล่าง หรือพิมพ์ตัวเลขได้ครับ (1 - 6 ชั่วโมง)",
  },
  {
    id: "support",
    question: "อยากให้ผู้ช่วยช่วยดูแลเรื่องใดเป็นพิเศษบ้างครับ?",
    hint: "เลือกสิ่งที่ต้องการได้มากกว่า 1 ข้อ หรือพิมพ์บอกเพิ่มเติมได้ครับ",
  },
  {
    id: "notes",
    question: "มีรายละเอียดสำคัญเพิ่มเติมไหมครับ? (เช่น มีรถเข็น หรือต้องช่วยพยุง)",
    hint: "พิมพ์รายละเอียดเพิ่มเติมได้เลยครับ หรือถ้าไม่มีกดปุ่ม 'ไม่มี / ข้าม' ได้ครับ",
  },
  {
    id: "review",
    question: "น้องแคร์สรุปข้อมูลให้เรียบร้อยแล้วครับ กรุณาตรวจสอบความถูกต้องก่อนส่งคำขอนะครับ",
    hint: "กดปุ่ม 'ยืนยันและส่งคำขอ' หรือพิมพ์ 'ยืนยัน' เพื่อส่งคำขอได้ทันทีครับ",
  },
];

const supportOptions = [
  "เดินเป็นเพื่อน",
  "ช่วยถือของชิ้นเล็ก",
  "ช่วยดูขั้นตอนและเอกสาร",
  "ช่วยใช้รถเข็น",
  "รอเป็นเพื่อนจนเสร็จธุระ",
];

type RequestData = {
  category: string;
  serviceDate: string;
  startTime: string;
  durationHours: number;
  pickup: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupAccuracyMeters?: number;
  destination: string;
  supportNeeds: string[];
  notes: string;
};

type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

const initialData: RequestData = {
  category: "",
  serviceDate: "",
  startTime: "",
  durationHours: 3,
  pickup: "",
  destination: "",
  supportNeeds: [],
  notes: "",
};

function RequestConversation() {
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<RequestData>(initialData);
  const [composerText, setComposerText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [voiceMode, setVoiceMode] = useState(searchParams.get("voice") === "1");
  const [createdRequest, setCreatedRequest] = useState<{ reference_no: string } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const currentStep = steps[stepIndex];

  const categoryLabel = useMemo(
    () => categories.find((c) => c.id === data.category)?.label ?? "",
    [data.category],
  );

  // Auto scroll to latest chat bubble
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [stepIndex, error, listening]);

  // Read stored voice intent from landing page if available
  useEffect(() => {
    const stored = sessionStorage.getItem("voiceIntent");
    if (!stored) return;
    const timer = window.setTimeout(() => {
      try {
        const intent = JSON.parse(stored);
        setData((previous) => ({
          ...previous,
          category: intent.category ?? previous.category,
          destination: intent.destination ?? previous.destination,
          serviceDate: intent.serviceDate ?? previous.serviceDate,
          startTime: intent.startTime ?? previous.startTime,
          supportNeeds: intent.supportNeeds ?? previous.supportNeeds,
        }));
        setVoiceMode(true);
        toast.success("นำข้อมูลจากเสียงมาเริ่มบทสนทนาแล้ว");
      } catch {
        toast.error("อ่านข้อมูลเสียงเดิมไม่ได้ กรุณาตอบคำถามใหม่อีกครั้ง");
      } finally {
        sessionStorage.removeItem("voiceIntent");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Voice TTS output for each step
  useEffect(() => {
    if (!voiceMode || typeof window === "undefined") return;

    let disposed = false;
    let fallbackStarted = false;
    window.speechSynthesis?.cancel();
    questionAudioRef.current?.pause();

    const speakWithInstalledGoogleVoice = () => {
      if (disposed || fallbackStarted || !window.speechSynthesis) return;
      fallbackStarted = true;
      const utterance = new SpeechSynthesisUtterance(currentStep.question);
      utterance.lang = "th-TH";
      utterance.rate = 0.92;
      const preferredVoice = findPreferredThaiVoice(window.speechSynthesis.getVoices());
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    };

    const audio = new Audio(buildGoogleTtsUrl(currentStep.question));
    questionAudioRef.current = audio;
    audio.onerror = speakWithInstalledGoogleVoice;
    audio.onended = () => {
      if (questionAudioRef.current === audio) questionAudioRef.current = null;
    };
    void audio.play().catch(speakWithInstalledGoogleVoice);

    return () => {
      disposed = true;
      audio.pause();
      audio.removeAttribute("src");
      if (questionAudioRef.current === audio) questionAudioRef.current = null;
      window.speechSynthesis?.cancel();
    };
  }, [currentStep.question, voiceMode]);

  function answerFor(index: number) {
    switch (steps[index].id) {
      case "category":
        return categoryLabel || data.category;
      case "datetime":
        return `${data.serviceDate ? formatThaiDate(data.serviceDate) : "ยังไม่ระบุ"} เวลา ${data.startTime || "09:00"} น.`;
      case "pickup":
        return data.pickup;
      case "destination":
        return data.destination;
      case "duration":
        return `${data.durationHours} ชั่วโมง`;
      case "support":
        return data.supportNeeds.length ? data.supportNeeds.join(", ") : "ช่วยเหลือทั่วไป";
      case "notes":
        return data.notes || "ไม่มีรายละเอียดเพิ่มเติม";
      default:
        return "";
    }
  }

  function advance() {
    setError("");
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function validateAndAdvance() {
    setError("");
    if (currentStep.id === "datetime") {
      if (!data.serviceDate || !data.startTime) {
        return setError("กรุณาระบุทั้งวันที่และเวลาครับ");
      }
      if (!isValidTime24Hour(data.startTime)) {
        return setError("กรุณากรอกเวลาแบบ 24 ชั่วโมง เช่น 09:00 หรือ 13:30");
      }
    }
    if (currentStep.id === "pickup" && data.pickup.trim().length < 4) {
      return setError("กรุณาระบุสถานที่ต้นทางอย่างน้อย 4 ตัวอักษรครับ");
    }
    if (currentStep.id === "destination" && data.destination.trim().length < 4) {
      return setError("กรุณาระบุจุดหมายอย่างน้อย 4 ตัวอักษรครับ");
    }
    if (currentStep.id === "destination" && data.destination.trim() === data.pickup.trim()) {
      return setError("สถานที่ต้นทางและจุดหมายต้องไม่เหมือนกันครับ");
    }
    if (currentStep.id === "support" && !data.supportNeeds.length) {
      return setError("กรุณากดเลือกสิ่งที่ต้องการให้ช่วยอย่างน้อยหนึ่งข้อครับ");
    }
    advance();
  }

  // Handle free-text submitted through LINE composer input
  function handleSendText(rawText: string) {
    const text = rawText.trim();
    if (!text) return;
    setError("");

    if (currentStep.id === "category") {
      const patch = getConversationVoicePatch("category", text);
      if (patch.category) {
        setData((prev) => ({ ...prev, category: patch.category! }));
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      const lower = text.toLowerCase();
      const matched = categories.find(
        (c) => lower.includes(c.label.toLowerCase()) || lower.includes(c.id),
      );
      if (matched) {
        setData((prev) => ({ ...prev, category: matched.id }));
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      setData((prev) => ({
        ...prev,
        category: "other",
        notes: prev.notes ? `${prev.notes} (ธุระ: ${text})` : `ธุระ: ${text}`,
      }));
      setComposerText("");
      setTimeout(advance, 200);
      return;
    }

    if (currentStep.id === "datetime") {
      const patch = getConversationVoicePatch("datetime", text);
      if (patch.serviceDate || patch.startTime) {
        const nextData = {
          ...data,
          ...(patch.serviceDate ? { serviceDate: patch.serviceDate } : {}),
          ...(patch.startTime ? { startTime: patch.startTime } : {}),
        };
        setData(nextData);
        setComposerText("");
        if (nextData.serviceDate && nextData.startTime) {
          setTimeout(advance, 200);
        } else {
          toast.info("ได้ข้อมูลบางส่วนแล้ว", {
            description: !nextData.serviceDate
              ? "กรุณาระบุวันที่เพิ่มเติมครับ"
              : "กรุณาระบุเวลาเพิ่มเติม เช่น 09:00",
          });
        }
        return;
      }
      if (isValidTime24Hour(text) || /^\d{4}$/.test(text)) {
        const formatted = formatTime24HourInput(text);
        setData((prev) => ({ ...prev, startTime: formatted }));
        setComposerText("");
        if (data.serviceDate) setTimeout(advance, 200);
        return;
      }
      setError("ยังอ่านวันหรือเวลาไม่ครบครับ ลองพิมพ์ เช่น ‘อีก 3 วัน 10 โมงเช้า’ หรือ ‘วันที่ 28 บ่ายสอง’");
      return;
    }

    if (currentStep.id === "pickup") {
      if (text.length < 4) {
        return setError("กรุณาระบุสถานที่ต้นทางให้ชัดเจนขึ้นอีกนิดครับ");
      }
      setData((prev) => ({ ...prev, pickup: text }));
      setComposerText("");
      setTimeout(advance, 200);
      return;
    }

    if (currentStep.id === "destination") {
      if (text.length < 4) {
        return setError("กรุณาระบุจุดหมายปลายทางให้ชัดเจนขึ้นอีกนิดครับ");
      }
      if (text === data.pickup) {
        return setError("จุดหมายต้องไม่ซ้ำกับสถานที่ต้นทางครับ");
      }
      const patch = getConversationVoicePatch("destination", text);
      setData((prev) => ({ ...prev, destination: patch.destination ?? text }));
      setComposerText("");
      setTimeout(advance, 200);
      return;
    }

    if (currentStep.id === "duration") {
      const patch = getConversationVoicePatch("duration", text);
      if (patch.durationHours) {
        setData((prev) => ({ ...prev, durationHours: patch.durationHours! }));
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      const num = parseInt(text.replace(/[^\d]/g, ""), 10);
      if (num >= 1 && num <= 12) {
        setData((prev) => ({ ...prev, durationHours: num }));
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      return setError("กรุณาระบุจำนวนชั่วโมง เช่น 2 หรือ 3 ชั่วโมงครับ");
    }

    if (currentStep.id === "support") {
      if (
        text.includes("เสร็จ") ||
        text.includes("พอ") ||
        text.includes("เรียบร้อย") ||
        text.includes("ตกลง")
      ) {
        if (!data.supportNeeds.length) {
          setData((prev) => ({ ...prev, supportNeeds: ["เดินเป็นเพื่อน"] }));
        }
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      const patch = getConversationVoicePatch("support", text);
      if (patch.supportNeeds?.length) {
        setData((prev) => ({
          ...prev,
          supportNeeds: [...new Set([...prev.supportNeeds, ...patch.supportNeeds!])],
        }));
        setComposerText("");
        setTimeout(advance, 200);
        return;
      }
      setData((prev) => ({
        ...prev,
        supportNeeds: [...new Set([...prev.supportNeeds, text])],
      }));
      setComposerText("");
      setTimeout(advance, 200);
      return;
    }

    if (currentStep.id === "notes") {
      if (
        text === "ไม่มี" ||
        text === "ข้าม" ||
        text === "-" ||
        text === "ไม่มีครับ" ||
        text === "ไม่มีค่ะ"
      ) {
        setData((prev) => ({ ...prev, notes: "" }));
      } else {
        setData((prev) => ({ ...prev, notes: text }));
      }
      setComposerText("");
      setTimeout(advance, 200);
      return;
    }

    if (currentStep.id === "review") {
      if (
        text.includes("ยืนยัน") ||
        text.includes("ตกลง") ||
        text.includes("ส่ง") ||
        text.includes("โอเค") ||
        text.toLowerCase().includes("ok")
      ) {
        setComposerText("");
        submitRequest();
        return;
      }
      if (text.includes("แก้") || text.includes("กลับ") || text.includes("ย้อน")) {
        setStepIndex(0);
        setComposerText("");
        return;
      }
    }
  }

  function applyVoiceAnswer(transcript: string) {
    setComposerText(transcript);
    handleSendText(transcript);
  }

  async function startListening() {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("เบราว์เซอร์นี้ไม่รองรับการพูด", {
        description: "กรุณาใช้ Chrome หรือพิมพ์คำตอบในช่องด้านล่างแทนครับ",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      toast.error("ไมโครโฟนยังไม่ได้รับอนุญาต", {
        description: "กดอนุญาตไมโครโฟนที่แถบที่อยู่ แล้วลองใหม่ครับ",
      });
      return;
    }
    const recognition = new (SpeechRecognition as new () => RecognitionInstance)();
    recognitionRef.current = recognition;
    recognition.lang = "th-TH";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => applyVoiceAnswer(event.results[0][0].transcript);
    recognition.onerror = () => toast.error("ไม่ได้ยินเสียง กรุณาลองพูดอีกครั้งครับ");
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    setListening(true);
    recognition.start();
  }

  async function submitRequest() {
    const parsed = serviceRequestSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูลอีกครั้งครับ");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถส่งคำขอได้");
      setCreatedRequest(body.data);
      toast.success("ส่งคำขอเรียบร้อยแล้ว");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เชื่อมต่อระบบไม่ได้");
    } finally {
      setBusy(false);
    }
  }

  // Quick helper dates
  const toDateInputValue = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };
  const todayStr = toDateInputValue(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toDateInputValue(tomorrowDate);

  if (createdRequest) {
    return (
      <div className="page-wrap line-request-page">
        <Card className="success-view" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div className="success-icon" style={{ margin: "0 auto 16px" }}>
            <Check size={44} />
          </div>
          <h1 style={{ fontSize: "1.8rem" }}>ส่งคำขอเรียบร้อยแล้วครับ</h1>
          <p style={{ fontSize: "1.05rem", color: "var(--muted)" }}>
            หมายเลขคำขอของคุณคือ <strong>{createdRequest.reference_no}</strong>
            <br />
            ระบบกำลังประสานงานแจ้งเตือนไปยังผู้ช่วยในพื้นที่ทันทีครับ
          </p>
          <div className="hero-actions" style={{ justifyContent: "center", marginTop: 24, gap: 12 }}>
            <Link
              className="button button-primary"
              href={`/customer/jobs/${createdRequest.reference_no}`}
            >
              ติดตามสถานะคำขอ
            </Link>
            <Link className="button button-ghost" href="/customer">
              กลับหน้าหลัก
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const placeholderMap: Record<ConversationStep, string> = {
    category: "พิมพ์บอกประเภทธุระ เช่น ไปโรงพยาบาล...",
    datetime: "เช่น อีก 3 วัน 10 โมงเช้า หรือ วันที่ 28 บ่ายสอง...",
    pickup: "พิมพ์สถานที่นัดรับ เช่น บ้านเลขที่ 123 ซอยสุขุมวิท 4...",
    destination: "พิมพ์จุดหมายปลายทาง เช่น โรงพยาบาลศิริราช...",
    duration: "พิมพ์จำนวนชั่วโมง เช่น 3 หรือ 4 ชั่วโมง...",
    support: "พิมพ์สิ่งที่ต้องการ หรือกดเลือกปุ่มด้านบน...",
    notes: "พิมพ์รายละเอียดเพิ่มเติม หรือพิมพ์ 'ไม่มี'...",
    review: "พิมพ์ 'ยืนยัน' เพื่อส่งคำขอ...",
  };

  return (
    <div className="page-wrap line-request-page">
      <div className="line-request-shell">
        {/* LINE Chat Header */}
        <div className="line-request-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div className="line-bot-avatar">
              <Bot size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", whiteSpace: "nowrap" }}>
                  น้องแคร์
                </h3>
                <span className="line-chat-status-pill">
                  <span className="online-dot" /> ออนไลน์
                </span>
              </div>
              <span className="line-header-subtitle" style={{ fontSize: ".78rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                ผู้ช่วย AI จัดการคำขอเดินทางทีละขั้นตอน
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span
              className="line-step-badge"
              style={{
                fontSize: ".78rem",
                fontWeight: 700,
                color: "var(--blue-dark)",
                background: "var(--sky)",
                padding: "3px 8px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              ข้อ {stepIndex + 1}/{steps.length}
            </span>
            <button
              type="button"
              className={`voice-mode-toggle ${voiceMode ? "active" : ""}`}
              onClick={() => setVoiceMode((v) => !v)}
              style={{ minHeight: 34, padding: "5px 9px", fontSize: ".78rem" }}
              title={voiceMode ? "ปิดเสียงอ่าน" : "เปิดเสียงอ่านอัตโนมัติ"}
              aria-label={voiceMode ? "ปิดเสียงอ่าน" : "เปิดเสียงอ่านอัตโนมัติ"}
            >
              {voiceMode ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="voice-toggle-text">{voiceMode ? "เสียงเปิด" : "เสียงปิด"}</span>
            </button>
          </div>
        </div>

        {/* LINE Chat Body Messages */}
        <div className="line-request-messages" aria-live="polite">
          {/* Previous Questions & Answers */}
          {steps.slice(0, stepIndex).map((step, idx) => (
            <div className="line-turn" key={step.id}>
              {/* Bot Question (Left) */}
              <div className="line-msg-row peer">
                <div className="line-bot-avatar" style={{ width: 34, height: 34 }}>
                  <Bot size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, maxWidth: "calc(100% - 44px)" }}>
                  <span style={{ fontSize: ".74rem", color: "rgba(255,255,255,.9)", marginBottom: 2 }}>
                    น้องแคร์
                  </span>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                    <div className="line-msg-bubble peer" style={{ padding: "10px 14px", fontSize: ".95rem" }}>
                      <strong>{step.question}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Answer (Right) */}
              <div className="line-msg-row me">
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, maxWidth: "85%", marginLeft: "auto" }}>
                  <div className="line-msg-bubble me" style={{ padding: "10px 14px", fontSize: ".95rem" }}>
                    {answerFor(idx)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current Active Step (Left) */}
          <div className="line-msg-row peer">
            <div className="line-bot-avatar" style={{ width: 38, height: 38 }}>
              <Bot size={20} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: "1 1 auto", maxWidth: "calc(100% - 46px)" }}>
              <span style={{ fontSize: ".76rem", color: "rgba(255,255,255,.9)", marginBottom: 2 }}>
                น้องแคร์
              </span>
              <div className="line-msg-bubble peer">
                <strong style={{ fontSize: "1.05rem", display: "block", color: "var(--navy)" }}>
                  {currentStep.question}
                </strong>
                <small style={{ display: "block", color: "var(--muted)", marginTop: 4, fontSize: ".84rem" }}>
                  💡 {currentStep.hint}
                </small>

                {/* Quick Action Options inside Bot Bubble */}
                <div className="line-action-box">
                  {/* Category choices */}
                  {currentStep.id === "category" && (
                    <div className="line-quick-btn-grid">
                      {categories.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          className={`line-quick-btn ${data.category === id ? "selected" : ""}`}
                          onClick={() => {
                            setData({ ...data, category: id });
                            setTimeout(advance, 150);
                          }}
                        >
                          <Icon size={20} style={{ color: "#06c755", flexShrink: 0 }} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Datetime choices */}
                  {currentStep.id === "datetime" && (
                    <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                        <button
                          type="button"
                          className={`line-quick-btn ${data.serviceDate === todayStr ? "selected" : ""}`}
                          style={{ minHeight: 40, padding: "8px 2px", justifyContent: "center", fontSize: ".88rem", textAlign: "center" }}
                          onClick={() => setData({ ...data, serviceDate: todayStr })}
                        >
                          วันนี้
                        </button>
                        <button
                          type="button"
                          className={`line-quick-btn ${data.serviceDate === tomorrowStr ? "selected" : ""}`}
                          style={{ minHeight: 40, padding: "8px 2px", justifyContent: "center", fontSize: ".88rem", textAlign: "center" }}
                          onClick={() => setData({ ...data, serviceDate: tomorrowStr })}
                        >
                          พรุ่งนี้
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                        <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                            <CalendarDays size={14} style={{ display: "inline", verticalAlign: "middle" }} /> วันที่
                          </span>
                          <input
                            type="date"
                            min={todayStr}
                            value={data.serviceDate}
                            onChange={(e) => setData({ ...data, serviceDate: e.target.value })}
                            style={{
                              width: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1.5px solid #cbd5e1",
                              fontSize: "16px",
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                            <Clock size={14} style={{ display: "inline", verticalAlign: "middle" }} /> เวลา (24 ชม.)
                          </span>
                          <input
                            type="text"
                            placeholder="09:00"
                            value={data.startTime}
                            maxLength={5}
                            onChange={(e) =>
                              setData({ ...data, startTime: formatTime24HourInput(e.target.value) })
                            }
                            style={{
                              width: "100%",
                              minWidth: 0,
                              boxSizing: "border-box",
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1.5px solid #cbd5e1",
                              fontSize: "16px",
                            }}
                          />
                        </label>
                      </div>

                      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 600 }}>เวลาแนะนำ:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                          {["09:00", "10:30", "13:00", "14:30"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`line-quick-btn ${data.startTime === t ? "selected" : ""}`}
                              style={{
                                minHeight: 36,
                                padding: "4px 2px",
                                fontSize: ".82rem",
                                justifyContent: "center",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                              }}
                              onClick={() => setData({ ...data, startTime: t })}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="button button-primary button-full"
                        style={{ minHeight: 44, fontSize: ".95rem", marginTop: 4 }}
                        onClick={validateAndAdvance}
                      >
                        ตกลงวันและเวลานี้
                      </button>
                    </div>
                  )}

                  {/* Pickup suggestions */}
                  {currentStep.id === "pickup" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <button
                        type="button"
                        className="button button-primary button-full"
                        onClick={() => setShowPickupMap((visible) => !visible)}
                      >
                        <MapPin size={18} />
                        {showPickupMap ? "ซ่อนแผนที่" : "แชร์ตำแหน่งปัจจุบัน / ปักหมุด"}
                      </button>
                      {showPickupMap && (
                        <LocationPickerMap
                          value={data.pickupLatitude !== undefined && data.pickupLongitude !== undefined
                            ? {
                                latitude: data.pickupLatitude,
                                longitude: data.pickupLongitude,
                                accuracyMeters: data.pickupAccuracyMeters,
                              }
                            : undefined}
                          onChange={(location) => setData((previous) => ({
                            ...previous,
                            pickup: previous.pickup.trim() || "ตำแหน่งที่ปักหมุดบนแผนที่",
                            pickupLatitude: location.latitude,
                            pickupLongitude: location.longitude,
                            pickupAccuracyMeters: location.accuracyMeters,
                          }))}
                          onClose={() => setShowPickupMap(false)}
                          onConfirm={() => {
                            setShowPickupMap(false);
                            setTimeout(advance, 150);
                          }}
                        />
                      )}
                      <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                        สถานที่แนะนำด่วน (หรือพิมพ์ระบุด้านล่าง):
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {["บ้านของฉัน", "คอนโด", "สถานีรถไฟฟ้า BTS อโศก", "หน้าปากซอย"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="line-quick-btn"
                            style={{ minHeight: 38, padding: "6px 12px", fontSize: ".88rem" }}
                            onClick={() => {
                              setData((previous) => ({
                                ...previous,
                                pickup: p,
                                pickupLatitude: undefined,
                                pickupLongitude: undefined,
                                pickupAccuracyMeters: undefined,
                              }));
                              setTimeout(advance, 150);
                            }}
                          >
                            <MapPin size={15} style={{ color: "#06c755" }} /> {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destination suggestions */}
                  {currentStep.id === "destination" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                        จุดหมายยอดนิยม (หรือพิมพ์ระบุด้านล่าง):
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                          "โรงพยาบาลศิริราช",
                          "โรงพยาบาลจุฬาลงกรณ์",
                          "โรงพยาบาลรามาธิบดี",
                          "ธนาคารกสิกรไทย",
                          "ห้างสรรพสินค้า",
                        ].map((d) => (
                          <button
                            key={d}
                            type="button"
                            className="line-quick-btn"
                            style={{ minHeight: 38, padding: "6px 12px", fontSize: ".88rem" }}
                            onClick={() => {
                              setData({ ...data, destination: d });
                              setTimeout(advance, 150);
                            }}
                          >
                            <MapPin size={15} style={{ color: "#06c755" }} /> {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration chips */}
                  {currentStep.id === "duration" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
                      {[1, 2, 3, 4, 5, 6].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          className={`line-quick-btn ${data.durationHours === hours ? "selected" : ""}`}
                          style={{
                            justifyContent: "center",
                            fontSize: ".92rem",
                            padding: "8px 4px",
                            minHeight: 42,
                            whiteSpace: "nowrap",
                          }}
                          onClick={() => {
                            setData({ ...data, durationHours: hours });
                            setTimeout(advance, 150);
                          }}
                        >
                          <Clock size={15} style={{ color: "#06c755", flexShrink: 0 }} /> {hours} ชม.
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Support needs */}
                  {currentStep.id === "support" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {supportOptions.map((opt) => {
                          const selected = data.supportNeeds.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`line-quick-btn ${selected ? "selected" : ""}`}
                              onClick={() => {
                                setData({
                                  ...data,
                                  supportNeeds: selected
                                    ? data.supportNeeds.filter((s) => s !== opt)
                                    : [...data.supportNeeds, opt],
                                });
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: "50%",
                                  border: "2px solid",
                                  borderColor: selected ? "#06c755" : "#cbd5e1",
                                  background: selected ? "#06c755" : "#fff",
                                  display: "grid",
                                  placeItems: "center",
                                  color: "#fff",
                                  flexShrink: 0,
                                }}
                              >
                                {selected && <Check size={13} strokeWidth={3} />}
                              </div>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        className="button button-primary button-full"
                        style={{ minHeight: 44, fontSize: ".95rem", marginTop: 6 }}
                        onClick={validateAndAdvance}
                      >
                        เลือกเสร็จแล้ว ({data.supportNeeds.length} รายการ)
                      </button>
                    </div>
                  )}

                  {/* Notes suggestions */}
                  {currentStep.id === "notes" && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <button
                          type="button"
                          className="line-quick-btn"
                          style={{
                            background: "#ecfdf5",
                            borderColor: "#a7f3d0",
                            color: "#047857",
                            fontWeight: 800,
                          }}
                          onClick={() => {
                            setData({ ...data, notes: "" });
                            advance();
                          }}
                        >
                          ไม่มีรายละเอียดเพิ่มเติม (ข้ามขั้นตอนนี้)
                        </button>
                        <button
                          type="button"
                          className="line-quick-btn"
                          onClick={() => {
                            setData({ ...data, notes: "มีรถเข็นพับได้นำไปด้วย" });
                            advance();
                          }}
                        >
                          มีรถเข็นพับได้นำไปด้วย
                        </button>
                        <button
                          type="button"
                          className="line-quick-btn"
                          onClick={() => {
                            setData({ ...data, notes: "ต้องช่วยพยุงเดินเป็นระยะ" });
                            advance();
                          }}
                        >
                          ต้องช่วยพยุงเดินเป็นระยะ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review Receipt Card */}
                  {currentStep.id === "review" && (
                    <div className="line-receipt-card">
                      <div
                        style={{
                          textAlign: "center",
                          paddingBottom: 10,
                          marginBottom: 8,
                          borderBottom: "1.5px dashed #cbd5e1",
                        }}
                      >
                        <strong style={{ fontSize: "1.1rem", color: "var(--navy)" }}>
                          สรุปรายการคำขอเดินทาง
                        </strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          Care Companion Service Summary
                        </small>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">ประเภทธุระ</span>
                        <span className="line-receipt-val">{categoryLabel || data.category}</span>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">วันและเวลานัด</span>
                        <span className="line-receipt-val">
                          {formatThaiDate(data.serviceDate)} · {data.startTime} น.
                        </span>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">จุดรับ (ต้นทาง)</span>
                        <span className="line-receipt-val">{data.pickup}</span>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">จุดหมาย (ปลายทาง)</span>
                        <span className="line-receipt-val">{data.destination}</span>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">ระยะเวลาบริการ</span>
                        <span className="line-receipt-val">{data.durationHours} ชั่วโมง</span>
                      </div>
                      <div className="line-receipt-row">
                        <span className="line-receipt-label">สิ่งที่ให้ช่วย</span>
                        <span className="line-receipt-val">
                          {data.supportNeeds.join(", ") || "ช่วยเหลือทั่วไป"}
                        </span>
                      </div>
                      {data.notes && (
                        <div className="line-receipt-row">
                          <span className="line-receipt-label">หมายเหตุ</span>
                          <span className="line-receipt-val">{data.notes}</span>
                        </div>
                      )}
                      <div className="line-receipt-row" style={{ paddingTop: 8, marginTop: 4 }}>
                        <span className="line-receipt-label" style={{ fontWeight: 800, color: "var(--navy)" }}>
                          ประมาณการค่าบริการ
                        </span>
                        <strong style={{ fontSize: "1.15rem", color: "#06c755" }}>
                          {formatMoney(data.durationHours * 300)} บาท
                        </strong>
                      </div>

                      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                        <button
                          type="button"
                          className="button button-primary button-full"
                          style={{
                            minHeight: 50,
                            fontSize: "1.05rem",
                            background: "linear-gradient(135deg, #06c755, #00b900)",
                          }}
                          disabled={busy}
                          onClick={submitRequest}
                        >
                          {busy ? "กำลังส่งคำขอ..." : "ยืนยันและส่งคำขอทันที ✨"}
                        </button>
                        <button
                          type="button"
                          className="button button-ghost button-full"
                          style={{ minHeight: 40, fontSize: ".9rem" }}
                          onClick={() => setStepIndex(0)}
                        >
                          <RotateCcw size={15} /> เริ่มกรอกใหม่ตั้งแต่แรก
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "#fff0f1",
                      color: "var(--red)",
                      fontWeight: 700,
                      fontSize: ".9rem",
                    }}
                    role="alert"
                  >
                    ⚠️ {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div ref={endRef} />
        </div>

        {/* LINE Bottom Composer Input Bar */}
        <form
          className="line-composer-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendText(composerText);
          }}
        >
          {/* Back Step Button */}
          {stepIndex > 0 ? (
            <button
              type="button"
              className="line-mic-btn"
              onClick={() => {
                setError("");
                setStepIndex((idx) => Math.max(0, idx - 1));
              }}
              title="ย้อนกลับไปข้อก่อนหน้า"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Link
              href="/customer"
              className="line-mic-btn"
              title="ยกเลิกและกลับหน้าหลัก"
              style={{ display: "grid", placeItems: "center" }}
            >
              <ArrowLeft size={20} />
            </Link>
          )}

          {/* Voice Mic Button */}
          <button
            type="button"
            className={`line-mic-btn ${listening ? "listening" : ""}`}
            onClick={() => (listening ? recognitionRef.current?.stop() : startListening())}
            title={listening ? "กำลังฟัง... กดเพื่อหยุด" : "กดเพื่อพูดตอบด้วยเสียง"}
          >
            {listening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            className="line-composer-input"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder={
              listening
                ? "🎙️ กำลังฟังเสียงของคุณตาคุณยาย..."
                : placeholderMap[currentStep.id] || "พิมพ์ข้อความที่นี่..."
            }
          />

          {/* Send Button */}
          <button
            type="submit"
            className="line-send-btn"
            disabled={!composerText.trim() && currentStep.id !== "datetime" && currentStep.id !== "support"}
            title="ส่งข้อความ"
            aria-label="ส่งข้อความ"
          >
            <Send size={20} style={{ marginLeft: 2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestConversation />
    </Suspense>
  );
}
