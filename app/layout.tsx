import type { Metadata, Viewport } from "next";
import { Toaster } from "../components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Care Companion | เพื่อนร่วมทุกการเดินทาง", template: "%s | Care Companion" },
  description: "แพลตฟอร์มค้นหาผู้ช่วยร่วมเดินทางสำหรับผู้สูงอายุและผู้ที่ต้องการความช่วยเหลือในการทำธุระนอกบ้าน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1769d2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="th"><body>{children}<Toaster /></body></html>;
}
