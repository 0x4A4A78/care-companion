"use client";

import { MessageCircle, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "../../../../../components/ui";
import { createClient } from "../../../../../lib/supabase/client";

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
  companionName = "คู่สนทนา",
  initialMessages,
  currentUserId,
  title = "ห้องแชท",
}: {
  requestId: string;
  companionName?: string;
  initialMessages: { id: number; sender_id: string; body: string; created_at: string }[];
  currentUserId?: string;
  title?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(currentUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Real-time Supabase subscription
  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      // client env not configured
    }

    if (supabase) {
      if (!activeUserId) {
        supabase.auth.getUser().then(({ data }) => {
          if (active && data.user) {
            setActiveUserId(data.user.id);
          }
        });
      }

      const channel = supabase
        .channel(`chat:${requestId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `request_id=eq.${requestId}`,
          },
          (payload) => {
            const newMsg = payload.new as {
              id: number;
              sender_id: string;
              body: string;
              created_at: string;
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          },
        )
        .subscribe();

      return () => {
        active = false;
        supabase?.removeChannel(channel);
      };
    }
  }, [requestId, activeUserId]);

  // Smart polling fallback (every 3.5s) to guarantee real-time updates even without WebSocket
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages((prev) => {
              if (data.messages.length !== prev.length) {
                return data.messages;
              }
              return prev;
            });
          }
        }
      } catch {
        // silent fallback
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [requestId]);

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

      setMessages((prev) => {
        if (prev.some((m) => m.id === result.message.id)) return prev;
        return [...prev, result.message];
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "เกิดข้อผิดพลาดในการส่งข้อความ");
      setText(bodyText);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="line-chat-wrapper" style={{ marginTop: 20 }}>
      {/* LINE Chat Header */}
      <div className="line-chat-header">
        <div className="line-chat-header-info">
          <MessageCircle size={22} style={{ color: "var(--blue)" }} />
          <div>
            <h3>{title}</h3>
            <span className="line-chat-partner">
              กำลังสนทนากับ <strong>{companionName}</strong>
            </span>
          </div>
        </div>
        <div className="line-chat-status-pill">
          <span className="online-dot" />
          <span>เรียลไทม์</span>
        </div>
      </div>

      {/* LINE Chat Messages Area */}
      <div className="line-chat-body" aria-live="polite">
        {messages.length === 0 ? (
          <div className="line-chat-empty">
            <p>ยังไม่มีข้อความในห้องนี้</p>
            <small>พิมพ์ข้อความด้านล่างเพื่อนัดหมายหรือสอบถามได้ทันทีค่ะ</small>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = Boolean(activeUserId && m.sender_id === activeUserId);
            const timeStr = new Date(m.created_at).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });

            if (isMe) {
              return (
                <div key={m.id} className="line-chat-row me">
                  <span className="line-chat-time me">{timeStr} น.</span>
                  <div className="line-chat-bubble me">
                    <p>{m.body}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="line-chat-row peer">
                <Avatar name={companionName.slice(0, 2)} tone="green" />
                <div className="line-chat-peer-content">
                  <span className="line-chat-sender-name">{companionName}</span>
                  <div className="line-chat-peer-bubble-row">
                    <div className="line-chat-bubble peer">
                      <p>{m.body}</p>
                    </div>
                    <span className="line-chat-time peer">{timeStr} น.</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* LINE Chat Composer */}
      <form onSubmit={sendMessage} className="line-chat-composer">
        <input
          placeholder={companionName ? `พิมพ์ข้อความถึง ${companionName}...` : "พิมพ์ข้อความ..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          disabled={sending}
          maxLength={2000}
        />
        <button
          type="submit"
          className="line-chat-send-btn"
          disabled={sending || !text.trim()}
          aria-label="ส่งข้อความ"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
