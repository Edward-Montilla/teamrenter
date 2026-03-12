-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_log_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.admin_bootstrap_allowlist (
  email text NOT NULL CHECK (email = lower(btrim(email))),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_bootstrap_allowlist_pkey PRIMARY KEY (email)
);
CREATE TABLE public.admin_role_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_snapshot text NOT NULL,
  full_name text CHECK (full_name IS NULL OR char_length(full_name) <= 100),
  reason text NOT NULL CHECK (char_length(btrim(reason)) > 0 AND char_length(reason) <= 1000),
  team_context text CHECK (team_context IS NULL OR char_length(team_context) <= 160),
  role_title text CHECK (role_title IS NULL OR char_length(role_title) <= 100),
  intended_activities jsonb,
  experience text CHECK (experience IS NULL OR char_length(experience) <= 500),
  urgency text DEFAULT 'normal' CHECK (urgency IS NULL OR urgency IN ('low', 'normal', 'high')),
  referral_admin_email text CHECK (referral_admin_email IS NULL OR char_length(referral_admin_email) <= 160),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_role_requests_pkey PRIMARY KEY (id),
  CONSTRAINT admin_role_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id),
  CONSTRAINT admin_role_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.distilled_insights (
  property_id uuid NOT NULL,
  insights_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text])),
  screened boolean NOT NULL DEFAULT false,
  screening_flags jsonb,
  last_generated_at timestamp with time zone NOT NULL DEFAULT now(),
  screened_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT distilled_insights_pkey PRIMARY KEY (property_id),
  CONSTRAINT distilled_insights_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'public'::text CHECK (role = ANY (ARRAY['public'::text, 'verified'::text, 'admin'::text])),
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  management_company text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.property_aggregates (
  property_id uuid NOT NULL,
  review_count integer NOT NULL DEFAULT 0,
  avg_management_responsiveness numeric,
  avg_maintenance_timeliness numeric,
  avg_listing_accuracy numeric,
  avg_fee_transparency numeric,
  avg_lease_clarity numeric,
  avg_trustscore numeric,
  display_management_responsiveness_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_management_responsiveness_0_5 >= 0 AND display_management_responsiveness_0_5 <= 5),
  display_maintenance_timeliness_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_maintenance_timeliness_0_5 >= 0 AND display_maintenance_timeliness_0_5 <= 5),
  display_listing_accuracy_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_listing_accuracy_0_5 >= 0 AND display_listing_accuracy_0_5 <= 5),
  display_fee_transparency_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_fee_transparency_0_5 >= 0 AND display_fee_transparency_0_5 <= 5),
  display_lease_clarity_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_lease_clarity_0_5 >= 0 AND display_lease_clarity_0_5 <= 5),
  display_trustscore_0_5 smallint NOT NULL DEFAULT 0 CHECK (display_trustscore_0_5 >= 0 AND display_trustscore_0_5 <= 5),
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_aggregates_pkey PRIMARY KEY (property_id),
  CONSTRAINT property_aggregates_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.property_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  r2_bucket text NOT NULL,
  r2_key text NOT NULL,
  content_type text,
  bytes bigint,
  width integer,
  height integer,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_photos_pkey PRIMARY KEY (id),
  CONSTRAINT property_photos_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT property_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'removed'::text])),
  management_responsiveness numeric NOT NULL CHECK (management_responsiveness >= 0::numeric AND management_responsiveness <= 5::numeric AND (management_responsiveness * 2::numeric) = trunc(management_responsiveness * 2::numeric)),
  maintenance_timeliness numeric NOT NULL CHECK (maintenance_timeliness >= 0::numeric AND maintenance_timeliness <= 5::numeric AND (maintenance_timeliness * 2::numeric) = trunc(maintenance_timeliness * 2::numeric)),
  listing_accuracy numeric NOT NULL CHECK (listing_accuracy >= 0::numeric AND listing_accuracy <= 5::numeric AND (listing_accuracy * 2::numeric) = trunc(listing_accuracy * 2::numeric)),
  fee_transparency numeric NOT NULL CHECK (fee_transparency >= 0::numeric AND fee_transparency <= 5::numeric AND (fee_transparency * 2::numeric) = trunc(fee_transparency * 2::numeric)),
  lease_clarity numeric NOT NULL CHECK (lease_clarity >= 0::numeric AND lease_clarity <= 5::numeric AND (lease_clarity * 2::numeric) = trunc(lease_clarity * 2::numeric)),
  text_input text CHECK (text_input IS NULL OR char_length(text_input) <= 500),
  tenancy_start date,
  tenancy_end date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
);