  -- Run once in Supabase SQL Editor for an existing Care Companion project.
  -- Provides a stable, RLS-safe feed of open jobs for authenticated companions.

  create or replace function public.list_open_requests_for_companion(result_limit integer default 50)
  returns table (
    id uuid,
    reference_no text,
    customer_id uuid,
    companion_id uuid,
    category text,
    service_date date,
    start_time time,
    duration_hours numeric,
    pickup text,
    destination text,
    support_needs text[],
    notes text,
    status public.service_status,
    created_at timestamptz,
    customer_name text
  )
  language plpgsql
  stable
  security definer
  set search_path = public
  as $$
  begin
    if auth.uid() is null or not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'companion'
        and p.is_active = true
    ) then
      raise exception 'companion access required' using errcode = '42501';
    end if;

    return query
    select
      r.id,
      r.reference_no,
      r.customer_id,
      r.companion_id,
      r.category,
      r.service_date,
      r.start_time,
      r.duration_hours,
      r.pickup,
      r.destination,
      r.support_needs,
      r.notes,
      r.status,
      r.created_at,
      p.full_name as customer_name
    from public.service_requests r
    join public.profiles p on p.id = r.customer_id
    where r.status = 'requested'
      and r.companion_id is null
    order by r.created_at desc
    limit greatest(1, least(coalesce(result_limit, 50), 100));
  end;
  $$;

  revoke all on function public.list_open_requests_for_companion(integer) from public, anon;
  grant execute on function public.list_open_requests_for_companion(integer) to authenticated;

  create or replace function public.accept_open_request_for_companion(target_request_id uuid)
  returns setof public.service_requests
  language plpgsql
  volatile
  security definer
  set search_path = public
  as $$
  begin
    if auth.uid() is null or not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'companion' and p.is_active = true
    ) then
      raise exception 'companion access required' using errcode = '42501';
    end if;

    return query
    update public.service_requests
    set companion_id = auth.uid(), status = 'accepted',
        accepted_at = now(), updated_at = now()
    where id = target_request_id
      and status = 'requested'
      and companion_id is null
    returning *;
  end;
  $$;

  revoke all on function public.accept_open_request_for_companion(uuid) from public, anon;
  grant execute on function public.accept_open_request_for_companion(uuid) to authenticated;
