-- Care Companion database schema for Supabase PostgreSQL
create type public.user_role as enum ('customer', 'companion', 'admin');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.service_status as enum ('requested', 'accepted', 'upcoming', 'in_service', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null check (char_length(full_name) between 1 and 120),
  avatar_path text,
  service_area text,
  bio text check (char_length(bio) <= 1000),
  verification_status public.verification_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  allergies text,
  chronic_diseases text,
  blood_type text,
  mobility_aid text,
  emergency_note text check (char_length(emergency_note) <= 1000),
  updated_at timestamptz not null default now()
);

create table public.companion_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  experience_years integer not null default 0 check (experience_years between 0 and 60),
  skills text[] not null default '{}',
  languages text[] not null default '{ภาษาไทย}',
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0),
  transportation text,
  available boolean not null default false
);

create table public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  relationship text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null default ('CC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id uuid not null references public.profiles(id),
  companion_id uuid references public.profiles(id),
  category text not null check (category in ('hospital','bank','government','shopping','other')),
  service_date date not null,
  start_time time not null,
  duration_hours numeric(4,1) not null check (duration_hours between 0.5 and 12),
  pickup text not null check (char_length(pickup) between 3 and 300),
  destination text not null check (char_length(destination) between 3 and 300),
  support_needs text[] not null default '{}',
  notes text not null default '' check (char_length(notes) <= 1000),
  status public.service_status not null default 'requested',
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pickup <> destination)
);

create table public.messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null references public.service_requests(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  companion_id uuid not null references public.profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now()
);

create index service_requests_customer_idx on public.service_requests(customer_id, created_at desc);
create index service_requests_companion_idx on public.service_requests(companion_id, created_at desc);
create index service_requests_status_date_idx on public.service_requests(status, service_date);
create index messages_request_created_idx on public.messages(request_id, created_at);

-- PostgreSQL privileges are required before Row Level Security policies are evaluated.
-- Anonymous visitors may only read data intended for the public catalogue.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.companion_details, public.reviews to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Keep future application tables usable when this schema is extended.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

create or replace function public.current_user_role() returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.companion_details enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.service_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.verification_documents enable row level security;

create policy "profiles public safe read" on public.profiles for select using (is_active or id = auth.uid() or public.current_user_role() = 'admin');
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid() and role in ('customer', 'companion'));
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role <> 'admin');
create policy "admins manage profiles" on public.profiles for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "profile contacts own" on public.profile_contacts for all using (profile_id = auth.uid() or public.current_user_role() = 'admin') with check (profile_id = auth.uid() or public.current_user_role() = 'admin');
create policy "companion details read" on public.companion_details for select using (true);
create policy "companion details own write" on public.companion_details for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "trusted contacts own" on public.trusted_contacts for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "requests participants read" on public.service_requests for select using (customer_id = auth.uid() or companion_id = auth.uid() or (status = 'requested' and public.current_user_role() = 'companion') or public.current_user_role() = 'admin');
create policy "customers create requests" on public.service_requests for insert with check (customer_id = auth.uid() and public.current_user_role() = 'customer');
create policy "participants update requests" on public.service_requests for update using ((companion_id is null and status = 'requested' and public.current_user_role() = 'companion') or customer_id = auth.uid() or companion_id = auth.uid() or public.current_user_role() = 'admin');
create policy "messages participants" on public.messages for select using (exists(select 1 from public.service_requests r where r.id=request_id and (r.customer_id=auth.uid() or r.companion_id=auth.uid() or public.current_user_role()='admin')));
create policy "messages participants insert" on public.messages for insert with check (sender_id=auth.uid() and exists(select 1 from public.service_requests r where r.id=request_id and (r.customer_id=auth.uid() or r.companion_id=auth.uid())));
create policy "reviews public read" on public.reviews for select using (true);
create policy "customers create reviews" on public.reviews for insert with check (customer_id=auth.uid() and exists(select 1 from public.service_requests r where r.id=request_id and r.customer_id=auth.uid() and r.status='completed'));
create policy "verification companion own read" on public.verification_documents for select using (companion_id=auth.uid() or public.current_user_role()='admin');
create policy "verification companion upload" on public.verification_documents for insert with check (companion_id=auth.uid());
create policy "verification admin update" on public.verification_documents for update using (public.current_user_role()='admin');

-- RLS-safe feed used by the Companion dashboard. The function validates the
-- authenticated role before reading open requests and exposes no contact data.
create or replace function public.list_open_requests_for_companion(result_limit integer default 50)
returns table (
  id uuid, reference_no text, customer_id uuid, companion_id uuid,
  category text, service_date date, start_time time, duration_hours numeric,
  pickup text, destination text, support_needs text[], notes text,
  status public.service_status, created_at timestamptz, customer_name text
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'companion' and p.is_active = true
  ) then
    raise exception 'companion access required' using errcode = '42501';
  end if;

  return query
  select r.id, r.reference_no, r.customer_id, r.companion_id, r.category,
    r.service_date, r.start_time, r.duration_hours, r.pickup, r.destination,
    r.support_needs, r.notes, r.status, r.created_at, p.full_name
  from public.service_requests r
  join public.profiles p on p.id = r.customer_id
  where r.status = 'requested' and r.companion_id is null
  order by r.created_at desc
  limit greatest(1, least(coalesce(result_limit, 50), 100));
end;
$$;

revoke all on function public.list_open_requests_for_companion(integer) from public, anon;
grant execute on function public.list_open_requests_for_companion(integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 5242880, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

create policy "companions upload own verification files" on storage.objects for insert to authenticated
with check (bucket_id='verification-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "companions read own verification files" on storage.objects for select to authenticated
using (bucket_id='verification-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.current_user_role()='admin'));

-- Assign admin only from the SQL editor or a secure server-side process; never from public registration.
