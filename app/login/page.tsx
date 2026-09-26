"use client";

import {
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Brand } from "../../components/brand";
import { GoogleSignIn } from "../../components/google-sign-in";
import { Card } from "../../components/ui";

function LoginContent() {
  const [role, setRole] = useState<"customer" | "companion">("customer");
  const errorCode = useSearchParams().get("error");
  const authError =
    errorCode === "profile"
      ? "เข้าสู่ระบบแล้ว แต่ยังสร้างโปรไฟล์ไม่ได้ กรุณาตรวจสอบ Database schema และ RLS"
      : errorCode === "oauth"
        ? "Google ยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่หรือตรวจสอบ Redirect URL"
        : errorCode === "session"
          ? "กรุณาเข้าสู่ระบบก่อนใช้งาน Care Companion"
          : null;

  return (
    <main className="login-page">
      <section className="login-side">
        <Brand />
        <h1>ยินดีต้อนรับ</h1>
        <p>เลือกประเภทผู้ใช้งาน แล้วเข้าสู่ระบบด้วยบัญชี Google</p>
        {authError && (
          <div className="auth-error" role="alert">
            <AlertTriangle size={21} />
            <span>{authError}</span>
          </div>
        )}
        <div className="role-options">
          <button
            className={`role-option ${role === "customer" ? "selected" : ""}`}
            onClick={() => setRole("customer")}
          >
            <UserRound size={30} />
            <span>
              <strong>ผู้ใช้บริการ (Customer)</strong>
              <small>ต้องการผู้ช่วยร่วมเดินทางหรือไปทำธุระ</small>
            </span>
          </button>
          <button
            className={`role-option ${role === "companion" ? "selected" : ""}`}
            onClick={() => setRole("companion")}
          >
            <UsersRound size={30} />
            <span>
              <strong>ผู้ช่วยร่วมเดินทาง (Companion)</strong>
              <small>นำเสนอข้อมูลและตอบรับคำขอบริการ</small>
            </span>
          </button>
        </div>
        <GoogleSignIn role={role} />
        <p className="login-note">
          การดำเนินการต่อถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
        </p>
      </section>
      <section className="login-side visual">
        <div className="visual-panel">
          <HeartHandshake size={60} />
          <h2>
            เดินทางอย่างอุ่นใจ
            <br />
            มีคนช่วยดูแลทุกขั้นตอน
          </h2>
          <Card>
            <div className="quick-contact">
              <ShieldCheck size={35} />
              <span>
                <strong>ข้อมูลและสิทธิ์ได้รับการปกป้อง</strong>
                <br />
                <small>
                  Google Sign-in • Supabase Auth • Row Level Security
                </small>
              </span>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page" aria-busy="true" />}>
      <LoginContent />
    </Suspense>
  );
}
