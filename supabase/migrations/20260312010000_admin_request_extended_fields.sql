-- Extend admin_role_requests with richer profile fields so reviewers
-- can make a well-informed approval/rejection decision.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN full_name text
        CHECK (full_name IS NULL OR char_length(full_name) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'role_title'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN role_title text
        CHECK (role_title IS NULL OR char_length(role_title) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'intended_activities'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN intended_activities jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'experience'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN experience text
        CHECK (experience IS NULL OR char_length(experience) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'urgency'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN urgency text DEFAULT 'normal'
        CHECK (urgency IS NULL OR urgency IN ('low', 'normal', 'high'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admin_role_requests'
      AND column_name = 'referral_admin_email'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN referral_admin_email text
        CHECK (referral_admin_email IS NULL OR char_length(referral_admin_email) <= 160);
  END IF;
END $$;
