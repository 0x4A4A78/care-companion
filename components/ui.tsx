import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string; style?: CSSProperties } & HTMLAttributes<HTMLElement>) {
  return <section className={`card ${className}`} {...props}>{children}</section>;
}

export function Badge({ children, tone = "blue", className = "", style }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "gray"; className?: string; style?: CSSProperties }) {
  return <span className={`badge badge-${tone} ${className}`} style={style}>{children}</span>;
}

export function Avatar({ name, tone = "blue", large = false }: { name: string; tone?: "blue" | "green" | "rose"; large?: boolean }) {
  return <span className={`avatar avatar-${tone} ${large ? "avatar-large" : ""}`} aria-label={`รูปโปรไฟล์ ${name}`}>{name.slice(0, 2)}</span>;
}

export function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <Card className="stat-card"><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</Card>;
}
