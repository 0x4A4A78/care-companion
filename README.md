# Care Companion

เว็บแอปพลิเคชันสำหรับเชื่อมโยงผู้ที่ต้องการเพื่อนร่วมเดินทาง (Customer) กับผู้ให้บริการร่วมเดินทาง (Companion) โดยไม่ใช่บริการทางการแพทย์

## ฟีเจอร์ที่มีในโครงงาน

- Landing page และ Google Sign-in ผ่าน Supabase Auth
- Customer dashboard, ค้นหา Companion, โปรไฟล์, request wizard 5 ขั้นตอน และติดตามสถานะงาน
- Companion dashboard, คำขอใหม่, สถานะความพร้อม ตารางงาน ครับแนน และรายได้
- Admin dashboard, สถิติ, จัดการผู้ใช้, ตรวจสอบตัวตน และรายการคำขอบริการ
- Responsive UI สำหรับ desktop/mobile เน้นตัวอักษรและปุ่มขนาดใหญ่
- PostgreSQL schema, indexes, Storage bucket และ Row Level Security
- Business rules และ Zod validation พร้อม unit tests
- Security headers และ OAuth callback ที่ป้องกัน open redirect

## เริ่มใช้งาน
 
```bash
npm install
copy .env.example .env.local
npm run dev -- -p 3001
```

เปิด [http://localhost:3000](http://localhost:3000) (หรือ [http://localhost:3001](http://localhost:3001)) แล้วเข้าสู่ระบบด้วย Google Account

## ตั้งค่า Supabase และ Google

1. สร้าง Supabase project แล้วนำ `supabase/schema.sql` ไปรันใน SQL Editor
2. ที่ Google Cloud Console สร้าง OAuth Client ประเภท Web application
3. เพิ่ม Authorized JavaScript origins:
   - สำหรับ Local: `http://localhost:3000` และ `http://localhost:3001`
   - สำหรับ Production: `https://care-companion-xi.vercel.app`
4. เพิ่ม Authorized redirect URI เป็น Supabase Callback URL ที่แสดงในหน้า Google Provider (รูปแบบ `https://<project-ref>.supabase.co/auth/v1/callback`)
5. เปิด Google Provider ใน Supabase Authentication แล้วใส่ Google Client ID และ Client Secret
6. ที่ Supabase Authentication > URL Configuration:
   - **Site URL**: `https://care-companion-xi.vercel.app` (หรือ `http://localhost:3000` ในเครื่อง)
   - **Redirect URLs**:
     - `http://localhost:3000/**`
     - `http://localhost:3001/**`
     - `https://care-companion-xi.vercel.app/**`
7. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ Project URL และ Publishable key จาก Supabase
8. รีสตาร์ต dev server หลังแก้ environment variables
9. กำหนด Admin จาก SQL Editor หรือ secure server process เท่านั้น ห้ามเปิดให้เลือก Admin จากหน้าสมัคร
10. หากเป็นฐานข้อมูลเดิม ให้รัน `supabase/migration_open_request_feed.sql` เพื่อให้ Companion เห็นคำขอใหม่ และรัน `supabase/migration_companion_workflow_security.sql` เพื่อเปิดกฎความปลอดภัยของขั้นตอนงาน

## ตรวจคุณภาพ

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

## Deploy บน Vercel

เว็บแอปพลิเคชันถูก Deploy ที่: **[https://care-companion-xi.vercel.app](https://care-companion-xi.vercel.app)**

เชื่อม repository กับ Vercel แล้วตั้งค่า Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

อย่าลืมเพิ่ม `https://care-companion-xi.vercel.app/**` ลงใน Redirect URLs ของ Supabase ก่อนเริ่มใช้งานจริง

> Companion ช่วยเหลือด้านการเดินทางและการทำธุระเท่านั้น ไม่ใช่บุคลากรทางการแพทย์หรือผู้ดูแลรักษาผู้ป่วย
