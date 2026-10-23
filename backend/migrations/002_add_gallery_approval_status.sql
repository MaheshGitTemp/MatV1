-- ============================================================================
-- Migration 002: Photo approval status on usergallery
-- ----------------------------------------------------------------------------
-- Adds an approval workflow to gallery images:
--   status = 'pending'  -> newly uploaded, NOT shown to other users
--          = 'approved' -> visible to everyone
--          = 'rejected' -> hidden (rejected by admin)
--
-- Backfill: every EXISTING image is marked 'approved' so the live site keeps
-- showing current photos. Only NEW uploads start as 'pending'.
--
-- Run manually (idempotent):
--   psql -U postgres -d postgres -f 002_add_gallery_approval_status.sql
-- ============================================================================

-- 1. Add the status column (default 'pending' so new rows need approval).
ALTER TABLE public.usergallery
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'pending';

-- 2. Grandfather all existing images as approved so nothing disappears.
--    (Safe to run repeatedly; on a fresh run every current row becomes approved.
--     New rows inserted after this migration default to 'pending'.)
UPDATE public.usergallery
  SET status = 'approved'
  WHERE status IS NULL OR status = 'pending';

-- 3. Index to keep the "approved only" filter fast on the read queries.
CREATE INDEX IF NOT EXISTS idx_usergallery_status
  ON public.usergallery (status);
