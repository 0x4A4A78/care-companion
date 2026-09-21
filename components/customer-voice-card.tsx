"use client";

import { Mic, Sparkles } from "lucide-react";
import { Card } from "./ui";

export function CustomerVoiceCard() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-voice-assistant", { detail: { mode: "listen" } }),
      );
    }
  };

  return (
    <Card
      className="voice-card voice-card-clickable"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="voice-card-icon">
        <Mic size={32} />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>บอกเราด้วยเสียง หรือพิมพ์บอก AI</h3>
          <span
            className="badge badge-blue"
            style={{ fontSize: ".75rem", padding: "3px 8px" }}
          >
            <Sparkles
              size={12}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            กดเพื่อเริ่ม
          </span>
        </div>
        <p style={{ margin: "4px 0 0" }}>
          กดแล้วพูดหรือพิมพ์ว่าอยากไปไหน AI จะช่วยจัดหาผู้ช่วยให้คุณทันที
        </p>
        <p
          className="voice-card-example"
          style={{
            marginTop: 8,
            fontSize: ".85rem",
            color: "var(--blue)",
            fontWeight: 650,
          }}
        >
          ลองพูด: &ldquo;อยากไปโรงพยาบาลศิริราชพรุ่งนี้ตอนเช้า&rdquo;
        </p>
      </div>
    </Card>
  );
}
