-- ============================================================================
-- Migration 004: Admin panel — admin accounts, audit log, profile approval,
--                impersonation (shadow-login) tokens.
-- ----------------------------------------------------------------------------
-- 1. adminlogin                  — separate admin accounts (no user-side link).
-- 2. admin_audit_log             — append-only record of admin actions.
-- 3. users.profile_status        — profile-level approval gate for signups,
--                                  existing users grandfathered via a one-shot
--                                  marker in app_settings.
-- 4. admin_impersonation_tokens  — single-use, short-lived shadow-login tokens.
--
-- Run manually (idempotent):
--   psql -U postgres -d postgres -f 004_admin_panel.sql
-- NOTE: NOT auto-run by the app. Admins are seeded via `node backend/makeadmin.js`.
-- ============================================================================

-- 1. Admin accounts -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adminlogin (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username   varchar(100) NOT NULL UNIQUE,
  email      varchar(255) NOT NULL UNIQUE,
  password   text NOT NULL,                 -- bcrypt hash (passwordfunction.hashPassword)
  name       varchar(150),
  role       varchar(30) NOT NULL DEFAULT 'admin',
  created_at timestamp without time zone DEFAULT now()
);

-- Example (DO NOT rely on this — use `node backend/makeadmin.js`):
-- INSERT INTO public.adminlogin (username, email, password, name)
--   VALUES ('superadmin', 'admin@example.com', '$2b$12$REPLACE_WITH_BCRYPT_HASH', 'Super Admin')
--   ON CONFLICT (username) DO NOTHING;

-- 2. Admin audit log ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id   integer REFERENCES public.adminlogin(id),
  action     varchar(100) NOT NULL,
  target_uid integer,                        -- nullable; the affected user, if any
  details    jsonb,                          -- nullable; free-form context
  created_at timestamp without time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log (created_at);

-- 3. Profile-level approval on users -----------------------------------------
--    New signups default to 'pending' (DB default — registration code unchanged).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_status varchar(20) NOT NULL DEFAULT 'pending';

--    The grandfather marker lives in app_settings (created by migration 003).
--    004 does NOT assume 003 ran: it CREATEs app_settings IF NOT EXISTS first
--    (identical column set to 003), so the marker read can never throw
--    "relation does not exist" and 004 runs standalone on a fresh/older DB.
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         varchar(100) PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamp without time zone DEFAULT now()
);

--    Grandfather: every EXISTING user is treated as already approved. Guarded by
--    a one-shot marker so a re-run (e.g. after real pending users exist) does NOT
--    flip them back to approved.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'profile_status_backfilled') THEN
    UPDATE public.users SET profile_status = 'approved';
    INSERT INTO public.app_settings (key, value)
      VALUES ('profile_status_backfilled', 'true')
      ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_profile_status ON public.users (profile_status);

-- 4. Impersonation (shadow-login) tokens -------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_impersonation_tokens (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token      varchar(128) NOT NULL UNIQUE,
  uid        integer NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  admin_id   integer,                        -- which admin issued it (no FK needed)
  expires_at timestamp without time zone NOT NULL,
  used       boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_impersonation_token ON public.admin_impersonation_tokens (token);
