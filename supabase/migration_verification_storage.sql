-- Run once in Supabase SQL Editor for existing Care Companion projects.
-- Enables the private Companion verification-document upload workflow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 5242880, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "companions upload own verification files" on storage.objects;
create policy "companions upload own verification files" on storage.objects for insert to authenticated
with check (bucket_id='verification-documents' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "companions read own verification files" on storage.objects;
create policy "companions read own verification files" on storage.objects for select to authenticated
using (bucket_id='verification-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.current_user_role()='admin'));

drop policy if exists "companions delete own verification files" on storage.objects;
create policy "companions delete own verification files" on storage.objects for delete to authenticated
using (bucket_id='verification-documents' and (storage.foldername(name))[1]=auth.uid()::text);
