"use client";

import { MessageCircle, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CancelRequestButton({
  requestId,
  canCancel,
}: {
  requestId: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!canCancel) return null;

  async function handleCancel() {
    if (!confirm("คุณต้องการยกเลิกคำขอบริการนี้ใช่หรือไม่?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถยกเลิกได้");
      toast.success("ยกเลิกคำขอเรียบร้อยแล้ว");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="button button-danger"
      onClick={handleCancel}
      disabled={busy}
    >
      <XCircle size={18} /> {busy ? "กำลังยกเลิก..." : "ยกเลิกคำขอ"}
    </button>
  );
}

export function JobChatSection({
  requestId,
  companionName,
  initialMessages,
}: {
  requestId: string;
  companionName?: string;
  initialMessages: { id: number; sender_id: string; body: string; created_at: string }[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const bodyText = text.trim();
    setText("");

    try {
      const res = await fetch(`/api/requests/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: bodyText }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "ส่งข้อความไม่สำเร็จ");

      setMessages((prev) => [...prev, result.message]);
      toast.success("ส่งข้อความแล้ว", {
        description: companionName ? `${companionName} ได้รับข้อความแล้ว` : undefined,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "เกิดข้อผิดพลาดในการส่งข้อความ");
      setText(bodyText);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="form-card" style={{ marginTop: 20 }}>
      <h2>
        <MessageCircle size={22} style={{ verticalAlign: "middle", display: "inline" }} /> ข้อความกับผู้ช่วย
      </h2>
      <div style={{ display: "grid", gap: 10, margin: "14px 0" }}>
        {messages.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            ยังไม่มีข้อความ สามารถพิมพ์เพื่อสอบถามหรือแจ้งรายละเอียดเพิ่มเติมแก่ผู้ช่วยได้
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="appointment"
              style={{ background: "#f1f5f9" }}
            >
              <p style={{ margin: 0, color: "var(--navy)", fontSize: ".95rem" }}>{m.body}</p>
              <small style={{ color: "var(--muted)", fontSize: ".75rem" }}>
                {new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
              </small>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="form-grid" style={{ marginTop: 15 }}>
        <label className="field" style={{ flex: 1 }}>
          <span className="sr-only">ข้อความ</span>
          <input
            placeholder={companionName ? `พิมพ์ข้อความถึง ${companionName}...` : "พิมพ์ข้อความ..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
        </label>
        <button
          type="submit"
          className="button button-primary"
          disabled={sending || !text.trim()}
          style={{ minWidth: 120 }}
        >
          <Send size={16} /> {sending ? "กำลังส่ง..." : "ส่งข้อความ"}
        </button>
      </form>
    </div>
  );
}
