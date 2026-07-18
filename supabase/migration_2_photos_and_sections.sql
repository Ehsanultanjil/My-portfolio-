-- Run this once in the Supabase SQL Editor (after setup.sql).
-- Adds: a photo field for projects, a section picker (Engineering Work vs
-- Community Work) so one form/table drives both tabs, a storage bucket for
-- uploaded photos, and migrates the 3 previously-hardcoded "Community Work"
-- cards into the database so they become editable too.

alter table projects add column if not exists image_url text;
alter table projects add column if not exists section text not null default 'engineering';

-- 'engineering' or 'community' are the only two values the site knows about.
alter table projects drop constraint if exists projects_section_check;
alter table projects add constraint projects_section_check check (section in ('engineering', 'community'));

-- Storage bucket for uploaded project photos (public read, admin-only write).
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Postgres has no "CREATE POLICY IF NOT EXISTS", so drop-then-create to keep
-- this file safe to re-run.
drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images"
on storage.objects for select
using (bucket_id = 'project-images');

drop policy if exists "Authenticated can upload project images" on storage.objects;
create policy "Authenticated can upload project images"
on storage.objects for insert
with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can update project images" on storage.objects;
create policy "Authenticated can update project images"
on storage.objects for update
using (bucket_id = 'project-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete project images" on storage.objects;
create policy "Authenticated can delete project images"
on storage.objects for delete
using (bucket_id = 'project-images' and auth.role() = 'authenticated');

-- Migrate the 3 existing hardcoded "Community Work" cards so they're now
-- editable from admin.html just like everything else. Safe to run once;
-- re-running will duplicate these rows, so only run this file one time.
insert into projects (title, description, tag, section, link_url, sort_order) values
    ('Moderation & Safety', 'Keeping Telegram communities safe, active, and spam-free with hands-on, responsive moderation.', '', 'community', 'https://www.fiverr.com/rafikhand1', 1),
    ('Member Engagement', 'Growing engagement and retention through active, day-to-day community management.', '', 'community', 'https://www.fiverr.com/rafikhand1', 2),
    ('Client Support', 'Fiverr Level 2 Seller with 65+ reviews and a 4.9★ rating for reliable, responsive service.', '', 'community', 'https://www.fiverr.com/rafikhand1', 3);
