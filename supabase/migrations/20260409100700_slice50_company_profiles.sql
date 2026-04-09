-- Slice 50 Phase 3: company_profiles table

CREATE TABLE public.company_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  company_name text NOT NULL,
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  website_url text,
  contact_email text,
  contact_phone text,
  logo_r2_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER company_profiles_set_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_select_public
  ON public.company_profiles
  FOR SELECT
  USING (true);

CREATE POLICY company_insert_own
  ON public.company_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'landlord'
    )
  );

CREATE POLICY company_update_own
  ON public.company_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'landlord'
    )
  )
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY company_select_admin
  ON public.company_profiles
  FOR SELECT
  USING (public.is_admin());
