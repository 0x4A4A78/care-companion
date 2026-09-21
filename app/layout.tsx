import type { Metadata } from "next";
import { Toaster } from "../components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Care Companion | เพื่อนร่วมทุกการเดินทาง", template: "%s | Care Companion" },
  description: "แพลตฟอร์มค้นหาผู้ช่วยร่วมเดินทางสำหรับผู้สูงอายุและผู้ที่ต้องการความช่วยเหลือในการทำธุระนอกบ้าน",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="th"><body>{children}<Toaster /></body></html>;
}
