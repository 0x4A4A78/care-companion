"use client";

import { Bell, CalendarDays, CircleHelp, ClipboardList, Home, LogOut, Search, Settings, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { Brand } from "./brand";
import { Avatar } from "./ui";

type Role = "customer" | "companion" | "admin";

const nav = {
  customer: [
    ["/customer", "หน้าหลัก", Home], ["/customer/request", "ขอผู้ช่วย", ClipboardList],
    ["/companions", "ค้นหาผู้ช่วย", Search], ["/customer/jobs", "งานของฉัน", CalendarDays],
    ["/customer/profile", "โปรไฟล์", UserRound],
  ],
  companion: [
    ["/companion", "หน้าหลัก", Home], ["/companion/requests", "คำขอใหม่", ClipboardList],
    ["/companion/jobs", "งานของฉัน", CalendarDays], ["/companion/profile", "โปรไฟล์", UserRound],
  ],
  admin: [
    ["/admin", "ภาพรวม", Home], ["/admin/users", "ผู้ใช้งาน", UsersRound],
    ["/admin/verifications", "ตรวจสอบตัวตน", ShieldCheck], ["/admin/requests", "คำขอบริการ", ClipboardList],
    ["/admin/settings", "ตั้งค่า", Settings],
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const meta = roleMeta[role];
  const mobileItems = nav[role];

  // Close popovers on navigation
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setShowNotifications(false);
    setShowUserMenu(false);
  }

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

  const profileHref = role === "customer" ? "/customer/profile" : role === "companion" ? "/companion/profile" : "/admin/settings";

  return (
    <PortalUserContext.Provider value={{ name: userName, role }}><div className="portal">
      <header className="topbar">
        <Brand />
        {role === "customer" ? (
          <form
            className="top-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = globalSearch.trim();
              router.push(query ? `/companions?q=${encodeURIComponent(query)}` : "/companions");
            }}
          >
            <Search size={20} />
            <label className="sr-only" htmlFor="portal-search">ค้นหาผู้ช่วย</label>
            <input id="portal-search" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="ค้นหาชื่อหรือความสามารถของผู้ช่วย..." />
          </form>
        ) : <div className="top-search-placeholder" aria-hidden="true" />}
        <div className="top-actions" style={{ position: "relative" }}>
          <button
            className="icon-button"
            aria-label="การแจ้งเตือน"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
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
                    เมื่อมีผู้ดูแลตอบรับงาน หรือมีข้อความใหม่ ระบบจะแจ้งเตือนให้ทราบที่นี่ครับ
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* User Chip with Toggle Popover */}
          <button
            type="button"
            className="user-chip-button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            aria-label="เมนูผู้ใช้งาน"
            aria-expanded={showUserMenu}
          >
            <Avatar name={userName} tone={meta.tone} />
            <span className="user-chip-text">
              <strong>{userName}</strong>
              <small>{meta.label}</small>
            </span>
          </button>

          {/* User Menu Popover (Especially important on Mobile) */}
          {showUserMenu && (
            <div className="user-menu-popover">
              <div className="user-menu-header">
                <Avatar name={userName} tone={meta.tone} />
                <div>
                  <strong style={{ display: "block", fontSize: ".95rem", color: "var(--navy)" }}>{userName}</strong>
                  <span className={`badge badge-${meta.tone}`} style={{ marginTop: 2 }}>{meta.label}</span>
                </div>
              </div>
              <div className="user-menu-list">
                <Link
                  href={profileHref}
                  className="user-menu-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserRound size={18} />
                  <span>โปรไฟล์และการตั้งค่า</span>
                </Link>
                <Link
                  href={`/${role}`}
                  className="user-menu-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Home size={18} />
                  <span>แดชบอร์ดหลัก ({meta.label})</span>
                </Link>
                <Link
                  href="/"
                  className="user-menu-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <CircleHelp size={18} />
                  <span>หน้าแรก Care Companion</span>
                </Link>
                <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--line)" }} />
                <button
                  type="button"
                  className="user-menu-item sign-out"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  <LogOut size={18} />
                  <span>{signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <aside className="sidebar">
        <nav aria-label="เมนูหลัก">
          {nav[role].map(([href, label, Icon], index) => {
            const active = isActive(href, index);
            return <Link key={`${label}-${index}`} href={href} className={active ? "active" : ""}><Icon size={23} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-bottom"><Link href="/"><CircleHelp size={22} />ความช่วยเหลือ</Link><button type="button" onClick={signOut} disabled={signingOut}><LogOut size={22} />{signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</button></div>
      </aside>
      <main className="portal-main">{children}</main>
      <nav
        className="mobile-nav"
        style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }}
        aria-label="เมนูมือถือ"
      >
        {mobileItems.map((item, index) => {
          const [href, label, Icon] = item;
          return (
            <Link
              key={`${label}-${index}`}
              href={href}
              className={isActive(href, index) ? "active" : ""}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div></PortalUserContext.Provider>
  );
}
