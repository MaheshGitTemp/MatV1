-- ============================================================================
-- Migration 003: Daily contact-view limit + admin-configurable settings
-- ----------------------------------------------------------------------------
-- 1. app_settings    — key/value config read at request time, so an admin can
--                      change the daily limit and it applies immediately.
-- 2. contact_views   — records which viewer saw which profile's contact on which
--                      day. Unique per (viewer, viewed profile, day) so viewing
--                      the SAME profile again the same day does not consume an
--                      extra slot; only distinct profiles count toward the limit.
--
-- Run manually (idempotent):
--   psql -U postgres -d postgres -f 003_contact_view_limit.sql
-- ============================================================================

-- 1. Settings table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         varchar(100) PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamp without time zone DEFAULT now()
);

-- Seed the daily contact-view limit (default 5). Admin edits this value later.
INSERT INTO public.app_settings (key, value)
  VALUES ('daily_contact_view_limit', '5')
  ON CONFLICT (key) DO NOTHING;

-- 2. Contact-view tracking table ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_views (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  viewer_id   integer NOT NULL,
  viewed_uid  integer NOT NULL,
  viewed_on   date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamp without time zone DEFAULT now(),
  CONSTRAINT contact_views_viewer_fkey  FOREIGN KEY (viewer_id)  REFERENCES public.users(uid) ON DELETE CASCADE,
  CONSTRAINT contact_views_viewed_fkey  FOREIGN KEY (viewed_uid) REFERENCES public.users(uid) ON DELETE CASCADE,
  CONSTRAINT contact_views_unique_per_day UNIQUE (viewer_id, viewed_uid, viewed_on)
);

-- Fast "how many distinct profiles did this viewer see today" lookups.
CREATE INDEX IF NOT EXISTS idx_contact_views_viewer_day
  ON public.contact_views (viewer_id, viewed_on);
