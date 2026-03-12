-- Reconcile admin_role_requests schema with current application code.
-- The earlier migration (20260312120000) created columns with different names
-- and types than what the deployed code expects. This migration renames, converts,
-- and adds the missing columns so the API stops returning 500.

-- 1. Drop table-level constraints that reference old column names / array types
ALTER TABLE public.admin_role_requests
  DROP CONSTRAINT IF EXISTS admin_role_requests_role_title_nonempty;
ALTER TABLE public.admin_role_requests
  DROP CONSTRAINT IF EXISTS admin_role_requests_intended_actions_nonempty;
ALTER TABLE public.admin_role_requests
  DROP CONSTRAINT IF EXISTS admin_role_requests_intended_actions_valid;

-- 2. Make role_title nullable (optional in the request form)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'admin_role_requests'
      AND column_name = 'role_title'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ALTER COLUMN role_title DROP NOT NULL;
  END IF;
END $$;

-- 3. Convert intended_actions text[] → jsonb, remap enum values, then rename
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'admin_role_requests'
      AND column_name = 'intended_actions'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ALTER COLUMN intended_actions DROP NOT NULL;

    ALTER TABLE public.admin_role_requests
      ALTER COLUMN intended_actions TYPE jsonb USING to_jsonb(intended_actions);

    UPDATE public.admin_role_requests
    SET intended_actions = (
      SELECT jsonb_agg(
        CASE elem
          WHEN 'moderate_reviews'          THEN 'review_moderation'
          WHEN 'manage_properties'         THEN 'property_management'
          WHEN 'manage_users'              THEN 'user_management'
          WHEN 'moderate_insights'         THEN 'insight_moderation'
          WHEN 'review_access_requests'    THEN 'audit_reporting'
          ELSE elem
        END
      )
      FROM jsonb_array_elements_text(intended_actions) AS elem
    )
    WHERE intended_actions IS NOT NULL;

    ALTER TABLE public.admin_role_requests
      RENAME COLUMN intended_actions TO intended_activities;
  END IF;
END $$;

-- 4. Rename referral_contact → referral_admin_email
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'admin_role_requests'
      AND column_name = 'referral_contact'
  ) THEN
    ALTER TABLE public.admin_role_requests
      RENAME COLUMN referral_contact TO referral_admin_email;
  END IF;
END $$;

-- 5. Add missing columns (experience, urgency)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'admin_role_requests'
      AND column_name = 'experience'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN experience text
        CHECK (experience IS NULL OR char_length(experience) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'admin_role_requests'
      AND column_name = 'urgency'
  ) THEN
    ALTER TABLE public.admin_role_requests
      ADD COLUMN urgency text DEFAULT 'normal'
        CHECK (urgency IS NULL OR urgency IN ('low', 'normal', 'high'));
  END IF;
END $$;
