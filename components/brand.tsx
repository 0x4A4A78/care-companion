import { HeartHandshake } from "lucide-react";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Care Companion หน้าหลัก">
      <span className="brand-mark"><HeartHandshake size={27} strokeWidth={2.4} /></span>
      {!compact && <span>Care Companion</span>}
    </Link>
  );
}
