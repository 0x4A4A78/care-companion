"use client";

import { Bell, CalendarDays, CircleHelp, ClipboardList, Home, LogOut, Mic, Search, Settings, ShieldCheck, UserRound, UsersRound, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Brand } from "./brand";
import { Avatar } from "./ui";
import { VoiceAssistant } from "./voice-assistant";

type Role = "customer" | "companion" | "admin";

const nav = {
  customer: [
    ["/customer", "หน้าหลัก", Home], ["/customer/request", "ขอผู้ช่วย", ClipboardList],
    ["/companions", "ค้นหาผู้ช่วย", Search], ["/customer", "งานของฉัน", CalendarDays],
    ["/customer/profile", "โปรไฟล์", UserRound],
  ],
  companion: [
    ["/companion", "หน้าหลัก", Home], ["/companion", "คำขอใหม่", ClipboardList],
    ["/companion", "ตารางเวลา", CalendarDays], ["/companion", "งานของฉัน", UsersRound],
    ["/companion", "รายได้", WalletCards],
  ],
  admin: [
    ["/admin", "ภาพรวม", Home], ["/admin", "ผู้ใช้งาน", UsersRound],
    ["/admin", "ตรวจสอบตัวตน", ShieldCheck], ["/admin", "คำขอบริการ", ClipboardList],
    ["/admin", "ตั้งค่า", Settings],
  ],
} as const;

const roleMeta = {
  customer: { label: "ผู้ใช้บริการ", tone: "rose" as const },
  companion: { label: "ผู้ช่วยร่วมเดินทาง", tone: "green" as const },
  admin: { label: "ผู้ดูแลระบบ", tone: "blue" as const },
};

const PortalUserContext = createContext<{ name: string; role: Role } | null>(null);

export function usePortalUser() {
  const user = useContext(PortalUserContext);
  if (!user) throw new Error("usePortalUser must be used inside PortalShell");
  return user;
}

export function PortalShell({ role, userName, children }: { role: Role; userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const meta = roleMeta[role];
  const mobileItems = role === "customer"
    ? [...nav[role].slice(0, 2), null, ...nav[role].slice(2, 4)]
    : [...nav[role].slice(0, 4)];

  const isActive = (href: string, index: number) =>
    index === 0
      ? pathname === href
      : pathname.startsWith(href) && href !== `/${role}`;

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <PortalUserContext.Provider value={{ name: userName, role }}><div className="portal">
      <header className="topbar">
        <Brand />
        <label className="top-search"><Search size={20} /><span className="sr-only">ค้นหา</span><input placeholder="ค้นหางาน ผู้ช่วย หรือข้อความ..." /></label>
        <div className="top-actions" style={{ position: "relative" }}>
          <button
            className="icon-button"
            aria-label="การแจ้งเตือน"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
          >
            <Bell size={23} />
            {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notifications-popover">
              <div className="notifications-popover-header">
                <strong>การแจ้งเตือน</strong>
                <button
                  type="button"
                  className="icon-button-sm"
                  onClick={() => setShowNotifications(false)}
                  aria-label="ปิด"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="notifications-popover-body">
                <div style={{ textAlign: "center", padding: "26px 18px", color: "var(--muted)" }}>
                  <Bell size={30} style={{ margin: "0 auto 8px", opacity: 0.35 }} />
                  <p style={{ margin: 0, fontWeight: 650, color: "var(--navy)", fontSize: ".92rem" }}>
                    ไม่มีการแจ้งเตือนใหม่ในขณะนี้
                  </p>
                  <small style={{ display: "block", marginTop: 4, fontSize: ".8rem", lineHeight: 1.4 }}>
                    เมื่อมีผู้ดูแลตอบรับงาน หรือมีข้อความใหม่ ระบบจะแจ้งเตือนให้ทราบที่นี่ค่ะ
                  </small>
                </div>
              </div>
            </div>
          )}
          <Link href={role === "customer" ? "/customer/profile" : `/${role}`} className="user-chip" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }} title="ดูโปรไฟล์และข้อมูลสุขภาพ"><Avatar name={userName} tone={meta.tone} /><span><strong>{userName}</strong><small>{meta.label}</small></span></Link>
        </div>
      </header>
      <aside className="sidebar">
        <nav aria-label="เมนูหลัก">
          {nav[role].map(([href, label, Icon], index) => {
            const active = isActive(href, index);
            return <Link key={`${label}-${index}`} href={href} className={active ? "active" : ""}><Icon size={23} /><span>{label}</span></Link>;
          })}
          {role === "customer" && (
            <Link href="/customer/request?voice=1" className={pathname.includes("voice") ? "active" : ""}>
              <Mic size={23} /><span>พูดบอกเรา</span>
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom"><Link href="/"><CircleHelp size={22} />ความช่วยเหลือ</Link><button type="button" onClick={signOut} disabled={signingOut}><LogOut size={22} />{signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</button></div>
      </aside>
      <main className="portal-main">{children}</main>
      <nav className={`mobile-nav ${role === "customer" ? "customer-mobile-nav" : ""}`} aria-label="เมนูมือถือ">
        {mobileItems.map((item, index) => {
          if (!item) {
            return <span key="voice-slot" className="mobile-voice-slot" aria-hidden="true" />;
          }

          const [href, label, Icon] = item;
          const navIndex = role === "customer" && index > 2 ? index - 1 : index;
          return (
            <Link
              key={`${label}-${index}`}
              href={href}
              className={isActive(href, navIndex) ? "active" : ""}
            >
              <Icon size={21} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      {role === "customer" && <VoiceAssistant />}
    </div></PortalUserContext.Provider>
  );
}
