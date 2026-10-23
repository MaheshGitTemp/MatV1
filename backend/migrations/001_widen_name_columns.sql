-- Migration: 001_widen_name_columns
--
-- Purpose:
--   The original schema (see telugusambandhamdump.sql) declares many user-facing
--   columns on public.users and public.userdetails using the internal PostgreSQL
--   `name` type. The `name` type silently truncates values to 63 bytes, which can
--   corrupt long names, addresses, emails, job titles, etc. This migration widens
--   every `name`-typed column to unbounded `text` to remove the truncation risk.
--
-- Safety / idempotency:
--   `ALTER COLUMN ... TYPE text` is non-destructive (no data loss) and is safe to
--   re-run: re-running against a column that is already `text` is a no-op.
--   Columns already `text` (users: none; userdetails.about, userdetails.partnerpreferences)
--   are intentionally NOT included.
--
-- How to run:
--   This script is NOT executed automatically. A DBA should run it manually against
--   the target database, e.g.:
--     psql "$DATABASE_URL" -f backend/migrations/001_widen_name_columns.sql
--   Take a backup first. Review in a non-production environment before applying.

BEGIN;

-- public.users (18 columns)
ALTER TABLE public.users ALTER COLUMN ufname TYPE text;
ALTER TABLE public.users ALTER COLUMN ulname TYPE text;
ALTER TABLE public.users ALTER COLUMN udob TYPE text;
ALTER TABLE public.users ALTER COLUMN utob TYPE text;
ALTER TABLE public.users ALTER COLUMN ugender TYPE text;
ALTER TABLE public.users ALTER COLUMN upob TYPE text;
ALTER TABLE public.users ALTER COLUMN upresentloc TYPE text;
ALTER TABLE public.users ALTER COLUMN uphone TYPE text;
ALTER TABLE public.users ALTER COLUMN uheight TYPE text;
ALTER TABLE public.users ALTER COLUMN ucaste TYPE text;
ALTER TABLE public.users ALTER COLUMN uemail TYPE text;
ALTER TABLE public.users ALTER COLUMN upassword TYPE text;
ALTER TABLE public.users ALTER COLUMN ujob TYPE text;
ALTER TABLE public.users ALTER COLUMN upackage TYPE text;
ALTER TABLE public.users ALTER COLUMN relation TYPE text;
ALTER TABLE public.users ALTER COLUMN ucreated TYPE text;
ALTER TABLE public.users ALTER COLUMN ucountry TYPE text;
ALTER TABLE public.users ALTER COLUMN ustate TYPE text;

-- public.userdetails (18 columns)
ALTER TABLE public.userdetails ALTER COLUMN familyresidence TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN fathername TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN mothername TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN fatheroccupation TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN motheroccupation TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN brothers TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN sisters TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN brothersmarried TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN sistersmarried TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN nakshtra TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN padam TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN rasi TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN habitdrink TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN habitsmoke TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN degree TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN jobcity TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN diet TYPE text;
ALTER TABLE public.userdetails ALTER COLUMN maritalstatus TYPE text;

COMMIT;
