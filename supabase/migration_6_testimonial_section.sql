-- Run this once in the Supabase SQL Editor (after migration_5_admin_v2.sql).
-- Adds the same Engineering/Community split projects already have to testimonials, so
-- reviews can be tagged as being for engineering work or Telegram/community work and
-- filtered the same way on the public site. Additive and safe to re-run.

alter table testimonials add column if not exists section text not null default 'engineering';
