  -- Care Companion Seed Data for Supabase
  -- Run this in Supabase Dashboard -> SQL Editor to populate realistic testing data

  -- 1. Create test user accounts in auth.users (if not already existing)
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    -- Companion 1: คุณนวพล ใจดี
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'noppol.companion@carecompanion.demo', crypt('CareCompanion2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"คุณนวพล ใจดี"}', now(), now()),
    -- Companion 2: คุณกานต์ ธนพร
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kan.companion@carecompanion.demo', crypt('CareCompanion2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"คุณกานต์ ธนพร"}', now(), now()),
    -- Companion 3: คุณสุรีย์ พรสุข
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suree.companion@carecompanion.demo', crypt('CareCompanion2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"คุณสุรีย์ พรสุข"}', now(), now()),
    -- Customer demo: คุณสมพร วัฒนะ
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'somporn.customer@carecompanion.demo', crypt('CareCompanion2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"คุณสมพร วัฒนะ"}', now(), now())
  on conflict (id) do nothing;

  -- 2. Insert Profiles
  insert into public.profiles (
    id, role, full_name, service_area, bio, verification_status, is_active, created_at, updated_at
  )
  values
    (
      '11111111-1111-1111-1111-111111111111',
      'companion',
      'คุณนวพล ใจดี',
      'กรุงเทพฯ และปริมณฑล (สุขุมวิท / บางนา)',
      'ยินดีเป็นเพื่อนร่วมเดินทาง ช่วยประสานงานทั่วไป รอคิว และดูแลให้คุณเดินทางถึงจุดหมายอย่างปลอดภัย มีประสบการณ์ดูแลและเดินทางเป็นเพื่อนผู้สูงอายุ 4 ปี สุภาพ ตรงเวลา มีความรู้เรื่องการปฐมพยาบาลเบื้องต้น',
      'approved',
      true,
      now() - interval '30 days',
      now()
    ),
    (
      '22222222-2222-2222-2222-222222222222',
      'companion',
      'คุณกานต์ ธนพร',
      'กรุงเทพฯ ฝั่งธนบุรี (ศิริราช / ปิ่นเกล้า / บางแค)',
      'อดีตเจ้าหน้าที่บริการลูกค้า 5 ปี ชำนาญเส้นทางโรงพยาบาลศิริราชและโรงพยาบาลรามาธิบดี ช่วยประสานงานและพาใช้รถเข็นได้คล่องแคล่ว พูดภาษาอังกฤษได้ดี',
      'approved',
      true,
      now() - interval '25 days',
      now()
    ),
    (
      '33333333-3333-3333-3333-333333333333',
      'companion',
      'คุณสุรีย์ พรสุข',
      'นนทบุรี / ปทุมธานี / จตุจักร',
      'ใจเย็น ยิ้มแย้ม มีประสบการณ์พาผู้สูงอายุไปทำธุรกรรมธนาคาร ซื้อสินค้า และติดต่อหน่วยงานราชการ ช่วยดูแลกระเป๋าและถือของชิ้นเล็กได้อย่างคล่องตัว',
      'approved',
      true,
      now() - interval '20 days',
      now()
    ),
    (
      '44444444-4444-4444-4444-444444444444',
      'customer',
      'คุณสมพร วัฒนะ',
      'สุขุมวิท 101 กรุงเทพฯ',
      'ผู้ใช้บริการ (ผู้สูงอายุ ต้องการผู้ช่วยร่วมเดินทางไปพบแพทย์และทำธุระ)',
      'approved',
      true,
      now() - interval '15 days',
      now()
    )
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    service_area = excluded.service_area,
    bio = excluded.bio,
    verification_status = excluded.verification_status,
    is_active = excluded.is_active;

  -- 3. Insert Companion Details
  insert into public.companion_details (
    profile_id, experience_years, skills, languages, hourly_rate, transportation, available
  )
  values
    (
      '11111111-1111-1111-1111-111111111111',
      4,
      array['พาไปโรงพยาบาล', 'ช่วยงานเอกสาร', 'เดินเป็นเพื่อน', 'รอคิวเป็นเพื่อน'],
      array['ภาษาไทย'],
      300.00,
      'รถยนต์ส่วนบุคคล / รถไฟฟ้า BTS',
      true
    ),
    (
      '22222222-2222-2222-2222-222222222222',
      5,
      array['ช่วยใช้รถเข็น', 'สื่อสารภาษาอังกฤษ', 'พาไปโรงพยาบาล', 'เดินเป็นเพื่อน'],
      array['ภาษาไทย', 'English'],
      350.00,
      'รถไฟฟ้า MRT / รถแท็กซี่',
      true
    ),
    (
      '33333333-3333-3333-3333-333333333333',
      3,
      array['พาไปธนาคาร', 'ช่วยซื้อสินค้า', 'ถือของชิ้นเล็ก', 'ติดต่อราชการ'],
      array['ภาษาไทย'],
      320.00,
      'รถยนต์ส่วนบุคคล',
      true
    )
  on conflict (profile_id) do update set
    experience_years = excluded.experience_years,
    skills = excluded.skills,
    languages = excluded.languages,
    hourly_rate = excluded.hourly_rate,
    transportation = excluded.transportation,
    available = excluded.available;

  -- 4. Insert Trusted Contacts
  insert into public.trusted_contacts (
    customer_id, name, relationship, phone
  )
  values
    (
      '44444444-4444-4444-4444-444444444444',
      'คุณอร วัฒนะ',
      'ลูกสาว',
      '081-234-5678'
    )
  on conflict do nothing;

  -- 5. Insert Sample Service Requests
  insert into public.service_requests (
    id, reference_no, customer_id, companion_id, category, service_date,
    start_time, duration_hours, pickup, destination, support_needs, notes,
    status, accepted_at, created_at
  )
  values
    (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'CC-240901',
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      'hospital',
      current_date + interval '1 day',
      '09:00:00',
      3.0,
      '99 ถนนสุขุมวิท 101 แขวงบางจาก เขตพระโขนง กรุงเทพฯ',
      'โรงพยาบาลศิริราช 2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพฯ',
      array['เดินเป็นเพื่อน', 'ช่วยถือของชิ้นเล็ก', 'ช่วยดูขั้นตอนและเอกสาร'],
      'เดินช้าเล็กน้อย กรุณามาถึงก่อนเวลานัดหมาย 15 นาที มีใบนัดตรวจตาครับ',
      'accepted',
      now() - interval '2 hours',
      now() - interval '1 day'
    ),
    (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'CC-240902',
      '44444444-4444-4444-4444-444444444444',
      null,
      'bank',
      current_date + interval '3 days',
      '13:30:00',
      2.0,
      '99 ถนนสุขุมวิท 101 แขวงบางจาก เขตพระโขนง กรุงเทพฯ',
      'ธนาคารกสิกรไทย สาขาซีคอนสแควร์ ศรีนครินทร์ กรุงเทพฯ',
      array['เดินเป็นเพื่อน', 'รอเป็นเพื่อนจนเสร็จธุระ'],
      'ต้องการไปปรับสมุดบัญชีและทำบัตรเดบิตใหม่ครับ',
      'requested',
      null,
      now() - interval '3 hours'
    ),
    (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'CC-240899',
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      'hospital',
      current_date - interval '5 days',
      '09:00:00',
      3.0,
      '99 ถนนสุขุมวิท 101 แขวงบางจาก เขตพระโขนง กรุงเทพฯ',
      'โรงพยาบาลศิริราช กรุงเทพฯ',
      array['เดินเป็นเพื่อน', 'ช่วยถือของชิ้นเล็ก'],
      'ไปพบแพทย์ตามนัดทั่วไป',
      'completed',
      now() - interval '6 days',
      now() - interval '6 days'
    )
  on conflict (id) do nothing;

  -- 6. Insert Reviews
  insert into public.reviews (
    request_id, customer_id, companion_id, rating, comment, created_at
  )
  values
    (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      5,
      'ตรงเวลา สุภาพ และอธิบายขั้นตอนได้เข้าใจง่าย ช่วยพาไปตรวจตามจุดต่าง ๆ ได้อย่างราบรื่น ทำให้สบายใจมากครับ',
      now() - interval '5 days'
    )
  on conflict (request_id) do nothing;

  -- 7. Insert Sample Chat Messages
  insert into public.messages (
    request_id, sender_id, body, created_at
  )
  values
    (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'สวัสดีครับคุณสมพร ผมนวพลนะครับ ได้รับงานเรียบร้อยแล้ว พรุ่งนี้จะไปถึงจุดนัดพบประมาณ 08:45 น. ครับ',
      now() - interval '2 hours'
    ),
    (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '44444444-4444-4444-4444-444444444444',
      'สวัสดีครับคุณนวพล ขอบคุณมากนะครับ พรุ่งนี้เจอกันหน้าบ้านครับ',
      now() - interval '1 hour'
    )
  on conflict do nothing;
