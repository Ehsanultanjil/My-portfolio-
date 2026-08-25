-- Run this once in the Supabase SQL Editor (after all previous migrations).
-- Adds three new keys to site_content for the desktop-only custom background:
--   video_bg_enabled  ('true'/'false')  -- toggle custom background on/off
--   video_bg_url      (text)            -- public URL of the uploaded video file
--   bg_image_url      (text)            -- public URL of the uploaded background image
-- Video takes priority if both are set. No new tables or schema changes.

insert into site_content (key, value) values
    ('video_bg_enabled', 'false'),
    ('video_bg_url', ''),
    ('bg_image_url', '')
on conflict (key) do nothing;
