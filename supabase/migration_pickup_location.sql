-- Add optional map coordinates for pickup locations.
-- Run this once in Supabase SQL Editor for an existing project.

alter table public.service_requests
  add column if not exists pickup_latitude double precision,
  add column if not exists pickup_longitude double precision,
  add column if not exists pickup_accuracy_meters double precision;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_pickup_latitude_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_pickup_latitude_check
      check (pickup_latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_pickup_longitude_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_pickup_longitude_check
      check (pickup_longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_pickup_accuracy_meters_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_pickup_accuracy_meters_check
      check (pickup_accuracy_meters between 0 and 10000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_pickup_coordinates_pair_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_pickup_coordinates_pair_check
      check (
        (pickup_latitude is null and pickup_longitude is null)
        or (pickup_latitude is not null and pickup_longitude is not null)
      );
  end if;
end
$$;
