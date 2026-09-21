"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { buildOAuthCallbackUrl } from "../lib/auth-redirect";
import { isGoogleProviderEnabled } from "../lib/supabase/auth-provider";
import { createClient } from "../lib/supabase/client";

export function GoogleSignIn({ role }: { role: "customer" | "companion" }) {
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    try {
      if (!(await isGoogleProviderEnabled())) {
        toast.error("Google Login ยังไม่เปิดใช้งาน", {
          description: "กรุณาเปิด Google Provider ใน Supabase Authentication ก่อน แล้วลองอีกครั้ง",
        });
        setBusy(false);
        return;
      }
      const supabase = createClient();
      const callback = buildOAuthCallbackUrl(window.location.origin, role);
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } });
      if (error) throw error;
    } catch (error) {
      const providerIsDisabled = error instanceof Error && /provider.+(disabled|enabled|supported)/i.test(error.message);
      toast.error("ยังเข้าสู่ระบบด้วย Google ไม่ได้", {
        description: providerIsDisabled
          ? "กรุณาเปิด Google Provider ใน Supabase Authentication ก่อน แล้วลองอีกครั้ง"
          : "ตรวจสอบการตั้งค่า Supabase และ Redirect URL แล้วลองใหม่อีกครั้ง",
      });
      setBusy(false);
    }
  }
  return <button className="google-button" onClick={signIn} disabled={busy}><Globe size={21} aria-hidden="true" />{busy ? "กำลังพาไป Google..." : "ดำเนินการต่อด้วย Google"}</button>;
}
