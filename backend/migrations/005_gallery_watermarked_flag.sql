-- ============================================================================
-- Migration 005: Track which gallery images already have the baked-in watermark
-- ----------------------------------------------------------------------------
-- New uploads are watermarked by imageService at upload time. This flag lets the
-- one-off backfill script (backend/scripts/watermarkExisting.js) skip rows it has
-- already processed, so it is safe to re-run without double-watermarking.
--
-- Run manually (idempotent):
--   psql -U postgres -d postgres -f 005_gallery_watermarked_flag.sql
-- ============================================================================

ALTER TABLE public.usergallery
  ADD COLUMN IF NOT EXISTS watermarked boolean NOT NULL DEFAULT false;
