"use client";

import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CircleEllipsis,
  Landmark,
  Mic,
  MicOff,
  Send,
  ShoppingBag,
  Stethoscope,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Card } from "../../../../components/ui";
import { buildGoogleTtsUrl, findPreferredThaiVoice } from "../../../../lib/google-tts";
import {
  formatTime24HourInput,
  getConversationVoicePatch,
  isValidTime24Hour,
  type ConversationStep,
} from "../../../../lib/request-conversation";
import { serviceRequestSchema } from "../../../../lib/request-schema";

const categories = [
  { id: "hospital", label: "ไปพบแพทย์ / โรงพยาบาล", Icon: Stethoscope },
  { id: "bank", label: "ไปธนาคาร", Icon: Landmark },
  { id: "government", label: "ติดต่อราชการ", Icon: Building2 },
  { id: "shopping", label: "ซื้อสินค้า", Icon: ShoppingBag },
  { id: "other", label: "ธุระอื่น ๆ", Icon: CircleEllipsis },
] as const;

const steps: { id: ConversationStep; question: string; hint: string }[] = [
  { id: "category", question: "วันนี้ต้องการไปทำธุระอะไรครับ?", hint: "เลือกประเภทที่ใกล้เคียงที่สุด" },
  { id: "datetime", question: "ต้องการให้ผู้ช่วยมาถึงวันไหน เวลาเท่าไรครับ?", hint: "เช่น พรุ่งนี้ 9 โมงเช้า" },
  { id: "pickup", question: "ให้ผู้ช่วยไปรับที่ไหนครับ?", hint: "ระบุบ้านเลขที่ ถนน และจุดสังเกต" },
  { id: "destination", question: "จุดหมายปลายทางคือที่ไหนครับ?", hint: "เช่น โรงพยาบาลศิริราช" },
  { id: "duration", question: "คาดว่าจะใช้บริการประมาณกี่ชั่วโมงครับ?", hint: "เลือกได้ตั้งแต่ 1–6 ชั่วโมง" },
  { id: "support", question: "อยากให้ผู้ช่วยช่วยเรื่องใดบ้างครับ?", hint: "เลือกได้มากกว่าหนึ่งข้อ" },
  { id: "notes", question: "มีรายละเอียดสำคัญเพิ่มเติมไหมครับ?", hint: "ไม่มีก็ข้ามได้ และไม่ควรใส่ข้อมูลสุขภาพที่ไม่จำเป็น" },
  { id: "review", question: "ข้อมูลครบแล้วครับ กรุณาตรวจสอบก่อนส่งคำขอ", hint: "ย้อนกลับไปแก้ไขได้หากข้อมูลยังไม่ถูกต้อง" },
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(searchParams.get("voice") === "1");
  const [createdRequest, setCreatedRequest] = useState<{ reference_no: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const currentStep = steps[stepIndex];

  const categoryLabel = useMemo(
    () => categories.find((category) => category.id === data.category)?.label ?? "",
    [data.category],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [stepIndex, error]);

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
      case "category": return categoryLabel;
      case "datetime": return `${data.serviceDate} เวลา ${data.startTime} น.`;
      case "pickup": return data.pickup;
      case "destination": return data.destination;
      case "duration": return `${data.durationHours} ชั่วโมง`;
      case "support": return data.supportNeeds.join(", ");
      case "notes": return data.notes || "ไม่มีรายละเอียดเพิ่มเติม";
      default: return "";
    }
  }

  function advance() {
    setError("");
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function validateAndAdvance() {
    setError("");
    if (currentStep.id === "datetime" && (!data.serviceDate || !data.startTime)) {
      return setError("กรุณาระบุทั้งวันที่และเวลา");
    }
    if (currentStep.id === "datetime" && !isValidTime24Hour(data.startTime)) {
      return setError("กรุณากรอกเวลาแบบ 24 ชั่วโมง เช่น 13:00 หรือ 20:00");
    }
    if (currentStep.id === "pickup" && data.pickup.trim().length < 8) {
      return setError("กรุณาระบุต้นทางอย่างน้อย 8 ตัวอักษร");
    }
    if (currentStep.id === "destination" && data.destination.trim().length < 8) {
      return setError("กรุณาระบุจุดหมายอย่างน้อย 8 ตัวอักษร");
    }
    if (currentStep.id === "destination" && data.destination.trim() === data.pickup.trim()) {
      return setError("ต้นทางและจุดหมายต้องไม่เหมือนกัน");
    }
    if (currentStep.id === "support" && !data.supportNeeds.length) {
      return setError("กรุณาเลือกอย่างน้อยหนึ่งรายการ");
    }
    advance();
  }

  function applyVoiceAnswer(transcript: string) {
    const patch = getConversationVoicePatch(currentStep.id, transcript);
    if (!Object.keys(patch).length) {
      toast.warning("ยังไม่เข้าใจคำตอบ", { description: "ลองพูดใหม่ หรือกรอกด้วยตนเองได้ครับ" });
      return;
    }
    const nextData = { ...data, ...patch } as RequestData;
    setData(nextData);
    const canAdvance = currentStep.id !== "datetime" || Boolean(nextData.serviceDate && nextData.startTime);
    if (canAdvance && currentStep.id !== "review") {
      setTimeout(advance, 250);
    } else {
      toast.info("ได้ข้อมูลบางส่วนแล้ว", { description: "กรุณาระบุวันและเวลาให้ครบครับ" });
    }
  }

  async function startListening() {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("เบราว์เซอร์นี้ไม่รองรับการพูด", { description: "กรุณาใช้ Chrome หรือพิมพ์คำตอบแทน" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      toast.error("ไมโครโฟนยังไม่ได้รับอนุญาต", { description: "กดอนุญาตไมโครโฟนที่แถบที่อยู่ แล้วลองใหม่" });
      return;
    }
    const recognition = new (SpeechRecognition as new () => RecognitionInstance)();
    recognitionRef.current = recognition;
    recognition.lang = "th-TH";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => applyVoiceAnswer(event.results[0][0].transcript);
    recognition.onerror = () => toast.error("ไม่ได้ยินเสียง กรุณาลองพูดอีกครั้ง");
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    setListening(true);
    recognition.start();
  }

  async function submitRequest() {
    const parsed = serviceRequestSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูลอีกครั้ง");
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

  if (createdRequest) {
    return <div className="page-wrap"><Card className="success-view"><div className="success-icon"><Check size={42} /></div><h1>ส่งคำขอเรียบร้อยแล้ว</h1><p>หมายเลขคำขอ <strong>{createdRequest.reference_no}</strong><br />ระบบกำลังค้นหาผู้ช่วยที่เหมาะกับคุณ</p><div className="hero-actions" style={{ justifyContent: "center" }}><Link className="button button-primary" href={`/customer/jobs/${createdRequest.reference_no}`}>ติดตามสถานะ</Link><Link className="button button-ghost" href="/customer">กลับหน้าหลัก</Link></div></Card></div>;
  }

  return (
    <div className="page-wrap request-page request-chat-page">
      <div className="request-chat-title">
        <div><h1>ขอผู้ช่วยร่วมเดินทาง</h1><p>ตอบคำถามสั้น ๆ ทีละข้อ ระบบจะช่วยสรุปให้</p></div>
        <button className={`voice-mode-toggle ${voiceMode ? "active" : ""}`} type="button" onClick={() => setVoiceMode((value) => !value)} aria-pressed={voiceMode}>
          {voiceMode ? <Volume2 size={19} /> : <VolumeX size={19} />}{voiceMode ? "โหมดเสียงเปิด" : "เปิดโหมดเสียง"}
        </button>
      </div>

      <Card className="request-chat-shell">
        <div className="request-chat-progress"><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
        <div className="request-chat-status">ขั้นตอน {stepIndex + 1} จาก {steps.length}</div>
        <div className="request-chat-messages" aria-live="polite">
          {steps.slice(0, stepIndex).map((step, index) => <div className="chat-turn" key={step.id}><div className="chat-row assistant"><span className="chat-avatar"><Bot size={18} /></span><div className="chat-bubble"><strong>{step.question}</strong></div></div><div className="chat-row user"><div className="chat-bubble">{answerFor(index)}</div></div></div>)}
          <div className="chat-row assistant current"><span className="chat-avatar"><Bot size={18} /></span><div className="chat-bubble"><strong>{currentStep.question}</strong><small>{currentStep.hint}</small></div></div>

          <div className="chat-answer-panel">
            {currentStep.id === "category" && <div className="chat-quick-grid">{categories.map(({ id, label, Icon }) => <button type="button" key={id} onClick={() => { setData({ ...data, category: id }); setTimeout(advance, 150); }}><Icon size={21} /><span>{label}</span></button>)}</div>}
            {currentStep.id === "datetime" && <div className="chat-fields"><label><span>วันที่</span><input type="date" value={data.serviceDate} onChange={(event) => setData({ ...data, serviceDate: event.target.value })} /></label><label><span>เวลา (24 ชั่วโมง)</span><input type="text" inputMode="numeric" autoComplete="off" maxLength={5} pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" placeholder="เช่น 20:00" aria-describedby="time-format-help" value={data.startTime} onChange={(event) => setData({ ...data, startTime: formatTime24HourInput(event.target.value) })} /><small id="time-format-help">พิมพ์ 2000 ระบบจะจัดเป็น 20:00</small></label><div className="time-quick-options" aria-label="เลือกเวลาด่วน">{["09:00", "13:00", "20:00"].map((time) => <button className={data.startTime === time ? "selected" : ""} type="button" key={time} onClick={() => setData({ ...data, startTime: time })}>{time}</button>)}</div><button className="button button-primary" type="button" onClick={validateAndAdvance}>ตอบคำถาม</button></div>}
            {(currentStep.id === "pickup" || currentStep.id === "destination") && <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); validateAndAdvance(); }}><input autoFocus value={currentStep.id === "pickup" ? data.pickup : data.destination} onChange={(event) => setData({ ...data, [currentStep.id]: event.target.value })} placeholder="พิมพ์สถานที่..." /><button type="submit" aria-label="ส่งคำตอบ"><Send size={20} /></button></form>}
            {currentStep.id === "duration" && <div className="chat-quick-grid duration">{[1, 2, 3, 4, 5, 6].map((hours) => <button type="button" key={hours} onClick={() => { setData({ ...data, durationHours: hours }); setTimeout(advance, 150); }}>{hours} ชั่วโมง</button>)}</div>}
            {currentStep.id === "support" && <><div className="chat-quick-grid support">{supportOptions.map((option) => { const selected = data.supportNeeds.includes(option); return <button type="button" aria-pressed={selected} className={selected ? "selected" : ""} key={option} onClick={() => setData({ ...data, supportNeeds: selected ? data.supportNeeds.filter((item) => item !== option) : [...data.supportNeeds, option] })}>{selected && <Check size={17} />}{option}</button>; })}</div><button className="button button-primary button-full" type="button" onClick={validateAndAdvance}>เลือกเสร็จแล้ว</button></>}
            {currentStep.id === "notes" && <div className="chat-fields"><textarea maxLength={1000} value={data.notes} onChange={(event) => setData({ ...data, notes: event.target.value })} placeholder="พิมพ์รายละเอียด หรือกดข้าม..." /><div className="chat-note-actions"><button className="button button-ghost" type="button" onClick={() => { setData({ ...data, notes: "" }); advance(); }}>ไม่มี / ข้าม</button><button className="button button-primary" type="button" onClick={advance}>ตอบคำถาม</button></div></div>}
            {currentStep.id === "review" && <div className="chat-review"><dl><div><dt>ประเภทธุระ</dt><dd>{categoryLabel}</dd></div><div><dt>วันและเวลา</dt><dd>{data.serviceDate} · {data.startTime} น.</dd></div><div><dt>เส้นทาง</dt><dd>{data.pickup}<br />ถึง {data.destination}</dd></div><div><dt>ระยะเวลา</dt><dd>{data.durationHours} ชั่วโมง</dd></div><div><dt>ต้องการให้ช่วย</dt><dd>{data.supportNeeds.join(", ")}</dd></div><div><dt>หมายเหตุ</dt><dd>{data.notes || "ไม่มี"}</dd></div></dl><button className="button button-primary button-full" type="button" disabled={busy} onClick={submitRequest}>{busy ? "กำลังส่งคำขอ..." : "ยืนยันและส่งคำขอ"}</button></div>}

            {currentStep.id !== "review" && <button className={`chat-mic-button ${listening ? "listening" : ""}`} type="button" onClick={() => listening ? recognitionRef.current?.stop() : startListening()}>{listening ? <MicOff size={21} /> : <Mic size={21} />}{listening ? "กำลังฟัง... กดเพื่อหยุด" : "ตอบด้วยเสียง"}</button>}
            {error && <p className="chat-error" role="alert">{error}</p>}
          </div>
          <div ref={endRef} />
        </div>
        <div className="request-chat-footer">{stepIndex > 0 ? <button type="button" className="button button-ghost" onClick={() => { setError(""); setStepIndex((index) => index - 1); }}><ArrowLeft size={18} /> ย้อนกลับ</button> : <Link className="button button-ghost" href="/customer">ยกเลิก</Link>}<span>ข้อมูลจะถูกบันทึกเมื่อกดยืนยันเท่านั้น</span></div>
      </Card>
    </div>
  );
}

export default function RequestPage() {
  return <Suspense><RequestConversation /></Suspense>;
}
