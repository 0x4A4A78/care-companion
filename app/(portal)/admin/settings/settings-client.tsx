"use client";

import {
  Activity,
  CheckCircle2,
  Database,
  Globe,
  Layers,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Card } from "../../../../components/ui";
import type { AdminSettingsData } from "../../../../lib/data/queries";

export function SettingsClient({ initialData }: { initialData: AdminSettingsData }) {
  const router = useRouter();
  const [data] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  // Audio / TTS Test state
  const [ttsText, setTtsText] = useState("สวัสดีครับ ระบบ Care Companion พร้อมดูแลทุกการเดินทางครับ");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      router.refresh();
      toast.success("รีเฟรชข้อมูลระบบเรียบร้อยแล้ว");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }

  async function handleTestDbConnection() {
    setIsTestingDb(true);
    const start = performance.now();
    try {
      await fetch("/api/admin/users?test=1", { method: "GET" }).catch(() => null);
      const end = performance.now();
      const latency = Math.round(end - start);
      setPingLatency(latency);
      toast.success(`เชื่อมต่อฐานข้อมูลสำเร็จ (Response time: ${latency} ms)`);
    } catch {
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
      toast.success(`ทดสอบการตอบสนองเสร็จสิ้น (${latency} ms)`);
    } finally {
      setIsTestingDb(false);
    }
  }

  function handlePlayTts() {
    if (!ttsText.trim()) {
      toast.error("กรุณาระบุข้อความที่ต้องการทดสอบ");
      return;
    }

    try {
      setIsPlayingAudio(true);
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(ttsText.trim())}`);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        // Fallback to browser SpeechSynthesis if audio endpoint fails
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(ttsText);
          utterance.lang = "th-TH";
          utterance.onend = () => setIsPlayingAudio(false);
          utterance.onerror = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          toast.info("ใช้ระบบสังเคราะห์เสียงของเบราว์เซอร์");
        } else {
          toast.error("ไม่สามารถเล่นเสียงได้");
        }
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(ttsText);
          utterance.lang = "th-TH";
          window.speechSynthesis.speak(utterance);
          toast.info("ใช้ระบบสังเคราะห์เสียงของเบราว์เซอร์");
        }
      });
    } catch {
      setIsPlayingAudio(false);
      toast.error("เกิดข้อผิดพลาดในการเล่นเสียง");
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* Overview Quick Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge tone="green">
            <CheckCircle2 size={14} /> ระบบทำงานปกติ
          </Badge>
          <span style={{ fontSize: ".88rem", color: "var(--muted)" }}>
            Node Environment: <strong>{data.envStatus.nodeEnv}</strong>
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={handleTestDbConnection}
            disabled={isTestingDb}
            style={{ minHeight: 38, padding: "6px 14px", fontSize: ".88rem" }}
          >
            <Activity size={16} />
            {isTestingDb ? "กำลังทดสอบ..." : pingLatency !== null ? `Latency: ${pingLatency}ms` : "ทดสอบ Ping DB"}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ minHeight: 38, padding: "6px 16px", fontSize: ".88rem" }}
          >
            <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Grid: Database Status & Env Health */}
      <div className="grid-2-cols" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
        {/* Supabase Status Card */}
        <Card className="data-card">
          <div className="data-card-header">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.15rem" }}>
                <Database size={20} style={{ color: "var(--blue)" }} /> สถานะฐานข้อมูล Supabase
              </h2>
              <small>การเชื่อมโยงระบบฐานข้อมูล PostgreSQL และ RLS Policies</small>
            </div>
          </div>
          <div style={{ padding: "18px 20px", display: "grid", gap: 12 }}>
            <div className="admin-status-row">
              <span className="admin-status-label">
                <Globe size={16} /> Supabase URL
              </span>
              <Badge tone={data.envStatus.hasSupabaseUrl ? "green" : "red"}>
                {data.envStatus.hasSupabaseUrl ? "เชื่อมต่อแล้ว" : "ไม่ได้ระบุ"}
              </Badge>
            </div>
            <div className="admin-status-row">
              <span className="admin-status-label">
                <Shield size={16} /> Supabase Publishable Key
              </span>
              <Badge tone={data.envStatus.hasPublishableKey ? "green" : "red"}>
                {data.envStatus.hasPublishableKey ? "พร้อมใช้งาน" : "ขาด Key"}
              </Badge>
            </div>
            <div className="admin-status-row">
              <span className="admin-status-label">
                <Activity size={16} /> DB Response Latency
              </span>
              <strong>{pingLatency !== null ? `${pingLatency} ms` : "ยังไม่ได้ทดสอบ"}</strong>
            </div>
          </div>
        </Card>

        {/* Database Rows Breakdown */}
        <Card className="data-card">
          <div className="data-card-header">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.15rem" }}>
                <Layers size={20} style={{ color: "var(--green)" }} /> จำนวนข้อมูลในแต่ละตาราง
              </h2>
              <small>บันทึกแถวข้อมูลจริงจาก PostgreSQL Tables</small>
            </div>
          </div>
          <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="admin-metric-box">
              <span className="metric-title">Profiles (ผู้ใช้)</span>
              <strong className="metric-val">{data.tableCounts.profiles}</strong>
            </div>
            <div className="admin-metric-box">
              <span className="metric-title">Companion Details</span>
              <strong className="metric-val">{data.tableCounts.companions}</strong>
            </div>
            <div className="admin-metric-box">
              <span className="metric-title">Service Requests</span>
              <strong className="metric-val">{data.tableCounts.requests}</strong>
            </div>
            <div className="admin-metric-box">
              <span className="metric-title">Chat Messages</span>
              <strong className="metric-val">{data.tableCounts.messages}</strong>
            </div>
            <div className="admin-metric-box">
              <span className="metric-title">Reviews (คะแนน)</span>
              <strong className="metric-val">{data.tableCounts.reviews}</strong>
            </div>
            <div className="admin-metric-box">
              <span className="metric-title">เอกสารตรวจสอบ</span>
              <strong className="metric-val">{data.tableCounts.documents}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Voice & Speech Diagnostics */}
      <Card className="data-card">
        <div className="data-card-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.15rem" }}>
              <Volume2 size={20} style={{ color: "var(--blue)" }} /> ระบบเสียงพูดช่วยเหลือ (Voice AI / TTS Engine)
            </h2>
            <small>ทดสอบความพร้อมของการสังเคราะห์เสียงภาษาไทยสำหรับผู้สูงอายุ</small>
          </div>
          <Badge tone="blue">ภาษาไทย (th-TH)</Badge>
        </div>
        <div style={{ padding: "20px", display: "grid", gap: 16 }}>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: ".92rem" }}>
            ระบบใช้ Google Cloud Text-to-Speech API ร่วมกับ Web Speech Synthesis
            เพื่ออ่านคำแนะนำและนำทางแก่ผู้สูงอายุอย่างเป็นธรรมชาติและชัดเจน
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              className="admin-tts-input"
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="พิมพ์ข้อความภาษาไทยเพื่อทดสอบ..."
              style={{
                flex: 1,
                minWidth: 260,
                minHeight: 44,
                padding: "8px 14px",
                borderRadius: 12,
                border: "1.5px solid var(--line)",
                fontSize: ".95rem",
              }}
            />
            <button
              type="button"
              className="button button-primary"
              onClick={handlePlayTts}
              disabled={isPlayingAudio}
              style={{ minHeight: 44, padding: "8px 20px" }}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 size={18} className="spin" /> กำลังเปล่งเสียง...
                </>
              ) : (
                <>
                  <Play size={18} /> ทดสอบเล่นเสียง
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Business & Platform Configuration */}
      <Card className="data-card">
        <div className="data-card-header">
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.15rem" }}>
              <Settings size={20} style={{ color: "var(--navy)" }} /> นโยบายและค่าบริการของแพลตฟอร์ม
            </h2>
            <small>พารามิเตอร์การทำงานและเกณฑ์มาตรฐานของระบบ</small>
          </div>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div className="admin-config-card">
            <strong>ค่าบริการเริ่มต้น (Base Rate)</strong>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
              300 บาท / ชั่วโมง (ผู้ช่วยสามารถปรับตามความเชี่ยวชาญได้)
            </p>
          </div>
          <div className="admin-config-card">
            <strong>ระยะเวลาบริการขั้นต่ำ</strong>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
              30 นาทีต่อหนึ่งคำขอ และไม่เกิน 12 ชั่วโมง
            </p>
          </div>
          <div className="admin-config-card">
            <strong>การตรวจสอบตัวตน (KYC)</strong>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".9rem" }}>
              ต้องผ่านการอนุมัติเอกสารจากแอดมินก่อนจึงจะเริ่มรับงานได้
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
