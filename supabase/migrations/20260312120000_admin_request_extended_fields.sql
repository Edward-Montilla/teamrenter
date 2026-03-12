-- Add extended fields to admin_role_requests for richer review context

ALTER TABLE public.admin_role_requests
  ADD COLUMN full_name text NOT NULL DEFAULT ''
    CHECK (char_length(full_name) <= 100),
  ADD COLUMN role_title text NOT NULL DEFAULT ''
    CHECK (char_length(role_title) <= 100),
  ADD COLUMN intended_actions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN referral_contact text
    CHECK (referral_contact IS NULL OR char_length(referral_contact) <= 200);

-- Backfill existing rows so the non-empty constraint can be applied
UPDATE public.admin_role_requests
SET full_name = email_snapshot,
    role_title = 'Not provided',
    intended_actions = ARRAY['moderate_reviews']
WHERE full_name = '';

-- Now tighten: full_name and role_title must be non-empty on new inserts
ALTER TABLE public.admin_role_requests
  ADD CONSTRAINT admin_role_requests_full_name_nonempty
    CHECK (char_length(btrim(full_name)) > 0);

ALTER TABLE public.admin_role_requests
  ADD CONSTRAINT admin_role_requests_role_title_nonempty
    CHECK (char_length(btrim(role_title)) > 0);

-- intended_actions must have at least one entry
ALTER TABLE public.admin_role_requests
  ADD CONSTRAINT admin_role_requests_intended_actions_nonempty
    CHECK (array_length(intended_actions, 1) >= 1);

-- Allowed values for intended_actions elements
ALTER TABLE public.admin_role_requests
  ADD CONSTRAINT admin_role_requests_intended_actions_valid
    CHECK (intended_actions <@ ARRAY[
      'moderate_reviews',
      'manage_properties',
      'manage_users',
      'moderate_insights',
      'review_access_requests'
    ]::text[]);

-- Remove the column defaults so future inserts must provide values
ALTER TABLE public.admin_role_requests
  ALTER COLUMN full_name DROP DEFAULT,
  ALTER COLUMN role_title DROP DEFAULT,
  ALTER COLUMN intended_actions DROP DEFAULT;
