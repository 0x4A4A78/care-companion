-- Run once in Supabase SQL Editor for existing Care Companion projects.
-- Restricts public profile visibility and prevents users from promoting or
-- approving their own accounts through the Supabase client.

drop policy if exists "profiles public safe read" on public.profiles;
drop policy if exists "profiles permitted read" on public.profiles;

create or replace function public.can_read_profile(target_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    target_profile_id = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (
      select 1 from public.profiles target
      where target.id = target_profile_id and target.role = 'companion'
        and target.is_active = true and target.verification_status = 'approved'
    )
    or exists (
      select 1 from public.service_requests request
      where (request.customer_id = target_profile_id or request.companion_id = target_profile_id)
        and (request.customer_id = auth.uid() or request.companion_id = auth.uid())
    );
$$;

revoke all on function public.can_read_profile(uuid) from public;
grant execute on function public.can_read_profile(uuid) to anon, authenticated;
create policy "profiles permitted read" on public.profiles for select using (public.can_read_profile(id));

drop policy if exists "companion details read" on public.companion_details;
drop policy if exists "companion details permitted read" on public.companion_details;
create policy "companion details permitted read" on public.companion_details for select
using (public.can_read_profile(profile_id));

create or replace function public.protect_profile_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() <> 'admin' and (
    new.role is distinct from old.role
    or new.verification_status is distinct from old.verification_status
    or new.is_active is distinct from old.is_active
  ) then
    raise exception 'only admins may update protected profile fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields_before_update on public.profiles;
create trigger protect_profile_admin_fields_before_update
before update on public.profiles for each row execute function public.protect_profile_admin_fields();
