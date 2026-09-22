-- Run once in Supabase SQL Editor for an existing Care Companion project.
-- Prevent users from escalating their own role or bypassing the request workflow.

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'admin' then
    new.role := old.role;
    new.verification_status := old.verification_status;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_security_fields_trigger on public.profiles;
create trigger protect_profile_security_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

create or replace function public.enforce_service_request_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role := public.current_user_role();
begin
  if actor_role = 'admin' then return new; end if;

  if new.customer_id <> old.customer_id
     or new.category <> old.category
     or new.service_date <> old.service_date
     or new.start_time <> old.start_time
     or new.duration_hours <> old.duration_hours
     or new.pickup <> old.pickup
     or new.destination <> old.destination
     or new.support_needs <> old.support_needs
     or new.notes <> old.notes then
    raise exception 'request details cannot be changed during a status action';
  end if;

  if actor_role = 'companion' then
    if old.status = 'requested' and old.companion_id is null
       and new.status = 'accepted' and new.companion_id = actor then return new; end if;
    if old.companion_id = actor and new.companion_id = old.companion_id
       and old.status in ('accepted', 'upcoming') and new.status = 'in_service' then return new; end if;
    if old.companion_id = actor and new.companion_id = old.companion_id
       and old.status = 'in_service' and new.status = 'completed' then return new; end if;
    if old.companion_id = actor and new.companion_id = old.companion_id
       and old.status in ('accepted', 'upcoming') and new.status = 'cancelled' then return new; end if;
  end if;

  if actor_role = 'customer' and old.customer_id = actor
     and new.customer_id = old.customer_id and new.companion_id is not distinct from old.companion_id
     and old.status in ('requested', 'accepted', 'upcoming') and new.status = 'cancelled' then return new; end if;

  raise exception 'invalid service request transition';
end;
$$;

drop trigger if exists enforce_service_request_workflow_trigger on public.service_requests;
create trigger enforce_service_request_workflow_trigger
before update on public.service_requests
for each row execute function public.enforce_service_request_workflow();
