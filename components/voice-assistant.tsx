"use client";

import {
  AlertCircle,
  Check,
  Keyboard,
  LockKeyhole,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseVoiceIntent, type VoiceIntent } from "../lib/parse-voice-intent";
import {
  getRecognitionEndAction,
  type RecognitionTermination,
} from "../lib/voice-recognition-session";
import { Badge } from "./ui";

type Phase = "idle" | "listening" | "result" | "guide";
type GuideReason =
  | "permission"
  | "network"
  | "audio-capture"
  | "no-speech"
  | "aborted"
  | "manual"
  | "other"
  | null;

/* ─── TTS helper: ใช้เสียง AI ผู้หญิงไทย (Google / Siri style) ผ่าน /api/tts ─── */
let _currentAudio: HTMLAudioElement | null = null;

function getBestThaiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const thai = voices.filter(
    (v) => v.lang === "th-TH" || v.lang === "th" || v.lang.startsWith("th-"),
  );
  if (!thai.length) return null;

  // ค้นหาเสียงผู้หญิงเป็นหลัก เช่น Premwadee, Achara, Kanya (Siri Thai), Google ภาษาไทย
  const female = thai.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes("premwadee") ||
      name.includes("achara") ||
      name.includes("kanya") ||
      name.includes("google") ||
      name.includes("female")
    );
  });

  return female || thai[0];
}

function stopSpeaking() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.currentTime = 0;
    _currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function speakWithWebSpeechFallback(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";

    const voice = getBestThaiVoice();
    if (voice) {
      u.voice = voice;
      const isMale =
        voice.name.toLowerCase().includes("pattara") ||
        voice.name.toLowerCase().includes("niwat");
      // ถ้าเป็นเสียงผู้ชายของระบบ ให้ปรับ pitch ให้สูงขึ้นเป็นเสียงผู้หญิงสดใส
      u.pitch = isMale ? 1.35 : 1.1;
    } else {
      u.pitch = 1.25;
    }

    u.rate = 0.92;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  } catch {
    // Ignore speech synthesis failures
  }
}

async function speak(text: string) {
  if (typeof window === "undefined") return;

  stopSpeaking();

  const cleanText = text.trim();
  if (!cleanText) return;

  try {
    // ลำดับที่ 1: ใช้ Google Thai Voice ผ่าน /api/tts ซึ่งเป็นเสียงผู้หญิงชัดเจน
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(audioUrl);
    _currentAudio = audio;

    audio.onended = () => {
      if (_currentAudio === audio) _currentAudio = null;
    };

    audio.onerror = () => {
      // เมื่อโหลดเสียงจาก API ไม่ได้ ให้สลับไป Web Speech API อัตโนมัติ
      speakWithWebSpeechFallback(cleanText);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[TTS] API Audio playback blocked or failed, fallback to Web Speech:", err);
        speakWithWebSpeechFallback(cleanText);
      });
    }
  } catch {
    speakWithWebSpeechFallback(cleanText);
  }
}

/* ─── Category label ─── */
const catLabel: Record<string, string> = {
  hospital: "ไปพบแพทย์ / โรงพยาบาล",
  bank: "ไปธนาคาร",
  government: "ติดต่อราชการ",
  shopping: "ซื้อสินค้า",
  other: "ธุระอื่น ๆ",
};

const samplePhrases = [
  "อยากไปโรงพยาบาลศิริราชพรุ่งนี้ตอนเช้า",
  "ไปธนาคารกสิกรวันจันทร์บ่ายสองโมง ช่วยถือของด้วย",
  "อยากไปซื้อของที่ตลาด ต้องใช้รถเข็น",
];

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

interface RecognitionSession {
  recognition: SpeechRecognitionInstance;
  termination: RecognitionTermination;
}

export function VoiceAssistant() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [guideReason, setGuideReason] = useState<GuideReason>(null);
  const [transcript, setTranscript] = useState("");
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [textInput, setTextInput] = useState("");

  const supported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const recRef = useRef<RecognitionSession | null>(null);
  const transcriptRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processText = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const parsed = parseVoiceIntent(trimmed);
    setIntent(parsed);
    setPhase("result");
    const msg = parsed.destination
      ? `เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยไป${parsed.destination}ให้นะคะ`
      : "เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยให้นะคะ";
    speak(msg);
  }, []);

  const startListening = useCallback(async () => {
    if (!supported) {
      setGuideReason("manual");
      setPhase("guide");
      toast.warning("เบราว์เซอร์นี้ไม่รองรับระบบเสียงพูด", {
        description: "คุณสามารถพิมพ์ข้อความหรือเลือกคำสั่งจำลองแทนได้ค่ะ",
      });
      return;
    }

    // Try requesting mic permission first via getUserMedia if available
    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices?.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err: unknown) {
        const errObj = err as { name?: string };
        if (
          errObj?.name === "NotAllowedError" ||
          errObj?.name === "PermissionDeniedError"
        ) {
          setGuideReason("permission");
          setPhase("guide");
          toast.error("ไมโครโฟนยังไม่ได้รับอนุญาต", {
            description:
              "โปรดคลิกอนุญาตไมโครโฟนที่แถบที่อยู่ด้านบน หรือพิมพ์ข้อความแทน",
          });
          return;
        } else if (
          errObj?.name === "NotFoundError" ||
          errObj?.name === "DevicesNotFoundError"
        ) {
          setGuideReason("audio-capture");
          setPhase("guide");
          toast.error("ไม่พบอุปกรณ์ไมโครโฟนในเครื่อง", {
            description: "คุณสามารถพิมพ์ข้อความแทนได้ค่ะ",
          });
          return;
        }
      }
    }

    setPhase("listening");
    setTranscript("");
    transcriptRef.current = "";
    setIntent(null);
    setGuideReason(null);

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setGuideReason("manual");
      setPhase("guide");
      return;
    }

    const rec = new (
      SpeechRecognition as new () => SpeechRecognitionInstance
    )();
    const session: RecognitionSession = {
      recognition: rec,
      termination: "natural",
    };
    rec.lang = "th-TH";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: { results: SpeechRecognitionResultList }) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text);
    };

    rec.onend = () => {
      if (recRef.current === session) recRef.current = null;
      const latestTranscript = transcriptRef.current;
      const action = getRecognitionEndAction(
        session.termination,
        latestTranscript,
      );
      if (action === "process") {
        processText(latestTranscript);
      } else if (action === "no-speech") {
        setGuideReason("no-speech");
        setPhase("guide");
        toast.info("ยังไม่ได้ยินเสียงพูด กรุณากดลองพูดอีกครั้ง หรือพิมพ์ข้อความแทน");
      }
    };

    rec.onerror = (e: { error: string }) => {
      if (session.termination === "cancelled") return;
      session.termination = "error";
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setGuideReason("permission");
        setPhase("guide");
        toast.error("ไมโครโฟนยังไม่ได้รับอนุญาต", {
          description: "โปรดดูวิธีอนุญาตไมโครโฟน หรือเลือกพิมพ์ข้อความแทน",
        });
      } else if (e.error === "no-speech") {
        setGuideReason("no-speech");
        setPhase("guide");
        toast.info("ยังไม่ได้ยินเสียงพูด กรุณากดพูดใหม่อีกครั้ง หรือพิมพ์ข้อความแทน");
      } else if (e.error === "audio-capture") {
        setGuideReason("audio-capture");
        setPhase("guide");
        toast.error("ไม่พบอุปกรณ์ไมโครโฟนในเครื่อง", {
          description: "คุณสามารถเลือกคำพูดจำลองหรือพิมพ์ข้อความแทนได้",
        });
      } else if (e.error === "network") {
        // KEEP MODAL OPEN! Never dismiss abruptly to idle
        setGuideReason("network");
        setPhase("guide");
        toast.error("การเชื่อมต่อระบบเสียงของเบราว์เซอร์ขัดข้อง", {
          description:
            "เปิดหน้าต่างพิมพ์ข้อความและคำแนะนำให้คุณแล้วค่ะ",
        });
      } else if (e.error === "aborted") {
        setGuideReason("aborted");
        setPhase("guide");
      } else {
        setGuideReason("other");
        setPhase("guide");
        toast.error("ไม่สามารถใช้ไมค์ได้ในขณะนี้", {
          description: "คุณสามารถเลือกคำพูดจำลองหรือพิมพ์ข้อความแทนได้",
        });
      }
    };

    try {
      recRef.current = session;
      rec.start();
    } catch {
      if (recRef.current === session) recRef.current = null;
      setGuideReason("network");
      setPhase("guide");
      toast.error("ไม่สามารถเริ่มการเชื่อมต่อระบบเสียงได้", {
        description: "คุณสามารถพิมพ์ข้อความแทนได้ทันทีค่ะ",
      });
    }
  }, [supported, processText]);

  const stopListening = useCallback(() => {
    recRef.current?.recognition.stop();
  }, []);

  const switchToText = useCallback(() => {
    stopSpeaking();
    const session = recRef.current;
    if (session) {
      session.termination = "cancelled";
      session.recognition.stop();
      recRef.current = null;
    }
    setGuideReason("manual");
    setPhase("guide");
  }, []);

  const handleConfirm = useCallback(() => {
    stopSpeaking();
    if (!intent) return;
    sessionStorage.setItem("voiceIntent", JSON.stringify(intent));
    router.push("/customer/request?voice=1");
    setPhase("idle");
    setIntent(null);
  }, [intent, router]);

  const handleClose = useCallback(() => {
    stopSpeaking();
    const session = recRef.current;
    if (session) {
      session.termination = "cancelled";
      session.recognition.stop();
      recRef.current = null;
    }
    setPhase("idle");
    setTranscript("");
    transcriptRef.current = "";
    setIntent(null);
    setGuideReason(null);
  }, []);

  const handleSelectPhrase = useCallback(
    (phrase: string) => {
      processText(phrase);
    },
    [processText],
  );

  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim()) return;
      processText(textInput);
      setTextInput("");
    },
    [textInput, processText],
  );

  // Focus input field when entering guide phase
  useEffect(() => {
    if (phase === "guide") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Listen to external triggers (e.g. customer dashboard voice card)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: "listen" | "text" }>;
      if (custom?.detail?.mode === "text") {
        switchToText();
      } else {
        startListening();
      }
    };
    window.addEventListener("open-voice-assistant", handler);
    return () => window.removeEventListener("open-voice-assistant", handler);
  }, [startListening, switchToText]);

  return (
    <>
      {/* Overlay */}
      {phase !== "idle" && (
        <div className="voice-overlay" onClick={handleClose} />
      )}

      {/* Result panel */}
      {phase === "result" && intent && (
        <div className="voice-panel">
          <div className="voice-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  const msg = intent.destination
                    ? `เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยไป${intent.destination}ให้นะคะ`
                    : "เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยให้นะคะ";
                  speak(msg);
                }}
                title="กดเพื่อฟังเสียง AI อีกครั้ง"
                aria-label="กดเพื่อฟังเสียง AI อีกครั้ง"
                style={{
                  background: "var(--blue-50, #eff6ff)",
                  color: "var(--blue, #2563eb)",
                  borderRadius: 8,
                  padding: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Volume2 size={20} />
              </button>
              <h3 style={{ margin: 0 }}>AI ผู้ช่วยเข้าใจแล้ว</h3>
            </div>
            <button
              className="icon-button"
              onClick={handleClose}
              aria-label="ปิด"
            >
              <X size={20} />
            </button>
          </div>
          <p className="voice-raw">&ldquo;{intent.raw}&rdquo;</p>
          <div className="voice-results">
            {intent.category && (
              <div className="voice-row">
                <span>ประเภท</span>
                <Badge tone="blue">{catLabel[intent.category]}</Badge>
              </div>
            )}
            {intent.destination && (
              <div className="voice-row">
                <span>จุดหมาย</span>
                <strong>{intent.destination}</strong>
              </div>
            )}
            {intent.serviceDate && (
              <div className="voice-row">
                <span>วันที่</span>
                <strong>{intent.serviceDate}</strong>
              </div>
            )}
            {intent.startTime && (
              <div className="voice-row">
                <span>เวลา</span>
                <strong>{intent.startTime} น.</strong>
              </div>
            )}
            {intent.supportNeeds && intent.supportNeeds.length > 0 && (
              <div className="voice-row">
                <span>ต้องการให้ช่วย</span>
                <strong>{intent.supportNeeds.join(", ")}</strong>
              </div>
            )}
          </div>
          <div className="voice-actions">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                const msg = intent.destination
                  ? `เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยไป${intent.destination}ให้นะคะ`
                  : "เข้าใจแล้วค่ะ จะช่วยหาผู้ช่วยให้นะคะ";
                speak(msg);
              }}
            >
              <Volume2 size={18} /> ฟังเสียงอีกครั้ง
            </button>
            <button className="button button-ghost" onClick={startListening}>
              <Mic size={18} /> พูดใหม่
            </button>
            <button className="button button-primary" onClick={handleConfirm}>
              <Send size={18} /> ยืนยันสร้างคำขอ
            </button>
          </div>
        </div>
      )}

      {/* Listening indicator */}
      {phase === "listening" && (
        <div className="voice-panel voice-listening-panel">
          <div className="voice-listening-anim">
            <div className="voice-wave" />
            <div className="voice-wave" />
            <div className="voice-wave" />
          </div>
          <h3>กำลังฟัง... พูดได้เลย</h3>
          <p
            style={{
              margin: "0 0 14px",
              color: "var(--muted)",
              fontSize: ".95rem",
            }}
          >
            พูดเช่น &ldquo;อยากไปโรงพยาบาลศิริราชพรุ่งนี้ตอนเช้า&rdquo;
          </p>
          {transcript && (
            <p className="voice-raw">&ldquo;{transcript}&rdquo;</p>
          )}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 15,
            }}
          >
            <button className="button button-danger" onClick={stopListening}>
              <MicOff size={18} /> หยุดฟัง
            </button>
            <button className="button button-ghost" onClick={switchToText}>
              <Keyboard size={18} /> พิมพ์แทน
            </button>
          </div>
        </div>
      )}

      {/* Guide / Text Fallback Panel (Never vanishes unexpectedly) */}
      {phase === "guide" && (
        <div className="voice-panel voice-guide-panel">
          <div className="voice-panel-header">
            <h3>
              {guideReason === "network" ? (
                <>
                  <WifiOff size={22} color="var(--red)" /> เชื่อมต่อระบบเสียงขัดข้อง
                </>
              ) : guideReason === "permission" ? (
                <>
                  <LockKeyhole size={22} color="var(--amber)" /> ไมโครโฟนยังไม่ได้รับอนุญาต
                </>
              ) : guideReason === "no-speech" ? (
                <>
                  <MicOff size={22} color="var(--blue)" /> ยังไม่ได้ยินเสียงพูด
                </>
              ) : (
                <>
                  <Sparkles size={22} color="var(--blue)" /> AI ผู้ช่วยจัดหาผู้ดูแล
                </>
              )}
            </h3>
            <button
              className="icon-button"
              onClick={handleClose}
              aria-label="ปิด"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contextual Notice based on guideReason */}
          {guideReason === "network" && (
            <div className="voice-notice voice-notice-error">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 750,
                  marginBottom: 6,
                }}
              >
                <AlertCircle size={18} /> ระบบถอดเสียงของเบราว์เซอร์ไม่สามารถติดต่อเซิร์ฟเวอร์ได้
              </div>
              <p style={{ margin: "0 0 6px", fontSize: ".86rem" }}>
                ระบบแปลงเสียงพูด (Web Speech API) พึ่งพาบริการรู้จำเสียงของ Google ซึ่งเบราว์เซอร์บางตัวจะบล็อกไว้:
              </p>
              <ul
                style={{
                  margin: "0 0 6px 18px",
                  padding: 0,
                  fontSize: ".84rem",
                  display: "grid",
                  gap: 6,
                }}
              >
                <li>
                  <strong>🦁 หากใช้เบราว์เซอร์ Brave:</strong> Brave บล็อกบริการ Google Speech เป็นค่าเริ่มต้น แม้จะเปิด{" "}
                  <em>&ldquo;Use Google services for push messaging&rdquo;</em> แล้วก็ยังไม่พอ
                  <br />
                  <strong style={{ color: "var(--red)" }}>วิธีแก้ (เลือกข้อใดข้อหนึ่ง):</strong>
                  <ol style={{ margin: "4px 0 0 18px", padding: 0, display: "grid", gap: 3 }}>
                    <li>
                      พิมพ์ <code>brave://flags/#brave-web-speech-api</code> ในแถบที่อยู่ แล้วเปลี่ยนเป็น <strong>Enabled</strong> จากนั้นกด <strong>Relaunch</strong>
                    </li>
                    <li>
                      หรือ <strong>เปลี่ยนไปใช้ Google Chrome / Microsoft Edge</strong> แทน เพราะรองรับ Web Speech API โดยตรงไม่ต้องตั้งค่าเพิ่ม
                    </li>
                  </ol>
                </li>
                <li>
                  <strong>📶 หากใช้ WiFi สถาบัน/หอพัก หรือ VPN:</strong> เครือข่ายอาจบล็อกการเชื่อมต่อไปยัง Google Speech — ลองเปลี่ยนเป็น 4G/5G จากมือถือ
                </li>
              </ul>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: ".85rem",
                  fontWeight: 650,
                  color: "var(--navy)",
                }}
              >
                💡 คุณสามารถพิมพ์ข้อความบอกธุระ หรือกดเลือกประโยคตัวอย่างด้านล่างได้ทันที AI จะจัดหาผู้ช่วยให้เหมือนกันทุกประการค่ะ
              </p>
            </div>
          )}

          {guideReason === "permission" && (
            <div className="voice-notice voice-notice-warning">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 750,
                  marginBottom: 6,
                }}
              >
                <LockKeyhole size={18} /> วิธีเปิดสิทธิ์ไมโครโฟนในเบราว์เซอร์
              </div>
              <ol
                style={{
                  margin: "4px 0 0 18px",
                  padding: 0,
                  fontSize: ".86rem",
                  display: "grid",
                  gap: 5,
                }}
              >
                <li>
                  ดูที่แถบใส่ที่อยู่เว็บด้านบน (URL) แล้วคลิกรูป{" "}
                  <strong>แม่กุญแจ</strong> หรือ <strong>การตั้งค่าไซต์</strong>
                </li>
                <li>
                  ตรงหัวข้อ <strong>&ldquo;ไมโครโฟน (Microphone)&rdquo;</strong>{" "}
                  ให้เปลี่ยนเป็น <strong>&ldquo;อนุญาต (Allow)&rdquo;</strong>
                </li>
                <li>
                  กดปุ่ม{" "}
                  <button
                    type="button"
                    className="voice-reload-inline"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={12} /> รีเฟรชหน้านี้
                  </button>{" "}
                  เพื่อใช้งานได้ทันที
                </li>
              </ol>
            </div>
          )}

          {guideReason === "no-speech" && (
            <div className="voice-notice voice-notice-info">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 750,
                  marginBottom: 4,
                }}
              >
                <MicOff size={18} /> ยังไม่ได้ยินเสียงพูด หรือพูดเบาเกินไป
              </div>
              <p style={{ margin: 0, fontSize: ".86rem" }}>
                ท่านสามารถกดปุ่ม <strong>&ldquo;ลองพูดอีกครั้ง&rdquo;</strong> ด้านล่าง หรือพิมพ์บอกธุระในช่องข้อความได้เลยค่ะ
              </p>
            </div>
          )}

          {guideReason === "audio-capture" && (
            <div className="voice-notice voice-notice-warning">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 750,
                  marginBottom: 4,
                }}
              >
                <AlertCircle size={18} /> ไม่พบอุปกรณ์ไมโครโฟนในเครื่องนี้
              </div>
              <p style={{ margin: 0, fontSize: ".86rem" }}>
                ท่านสามารถพิมพ์ข้อความบอกธุระ หรือเลือกประโยคตัวอย่างด้านล่างแทนได้เลยค่ะ
              </p>
            </div>
          )}

          {/* Text Input Form */}
          <form
            onSubmit={handleTextSubmit}
            className="voice-text-form"
            style={{ marginTop: 10 }}
          >
            <label className="sr-only" htmlFor="voice-text-fallback">
              พิมพ์ข้อความบอกธุระ
            </label>
            <input
              id="voice-text-fallback"
              ref={inputRef}
              type="text"
              className="voice-input"
              placeholder="พิมพ์บอกธุระ เช่น อยากไปโรงพยาบาลศิริราช พรุ่งนี้ 9 โมง..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <button
              type="submit"
              className="button button-primary"
              style={{ minHeight: 46, padding: "0 18px", flexShrink: 0 }}
              disabled={!textInput.trim()}
            >
              <Send size={16} /> ส่งข้อความ
            </button>
          </form>

          {/* Sample Phrases Chips */}
          <div style={{ marginTop: 16 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontWeight: 750,
                fontSize: ".92rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--navy)",
              }}
            >
              <Sparkles size={16} color="var(--blue)" /> หรือคลิกเลือกประโยคตัวอย่างเพื่อทดสอบ:
            </p>
            <div className="voice-chips">
              {samplePhrases.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  className="voice-chip"
                  onClick={() => handleSelectPhrase(phrase)}
                >
                  <Check size={14} /> &ldquo;{phrase}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              borderTop: "1px solid var(--line)",
              paddingTop: 14,
            }}
          >
            <button
              className="button button-primary"
              onClick={startListening}
              style={{ padding: "0 18px" }}
            >
              <Mic size={18} /> ลองกดพูดอีกครั้ง
            </button>
            <button className="button button-ghost" onClick={handleClose}>
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        className={`voice-fab ${phase === "listening" ? "voice-fab-active" : ""}`}
        onClick={phase === "listening" ? stopListening : startListening}
        aria-label="สั่งงานด้วยเสียงหรือข้อความ"
        title="สั่งงานด้วยเสียงหรือคลิกเพื่อเลือกข้อความ"
      >
        {phase === "listening" ? <MicOff size={28} /> : <Mic size={28} />}
        <span className="voice-fab-label">
          {phase === "listening" ? "กดหยุดฟัง" : "พูดบอกเรา"}
        </span>
      </button>
    </>
  );
}
