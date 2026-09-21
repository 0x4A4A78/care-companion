-- Migration: เพิ่มคอลัมน์ข้อมูลสุขภาพและการติดต่อในตาราง profile_contacts
ALTER TABLE public.profile_contacts
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS chronic_diseases text,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS mobility_aid text;

-- อัปเดตขนาด emergency_note ให้บันทึกได้ละเอียดขึ้น
ALTER TABLE public.profile_contacts
  DROP CONSTRAINT IF EXISTS profile_contacts_emergency_note_check;

ALTER TABLE public.profile_contacts
  ADD CONSTRAINT profile_contacts_emergency_note_check
  CHECK (char_length(emergency_note) <= 1000);
