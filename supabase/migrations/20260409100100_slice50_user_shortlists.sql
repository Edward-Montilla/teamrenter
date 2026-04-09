-- Slice 50 Phase 3: user_shortlists table

CREATE TABLE public.user_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_shortlists_unique UNIQUE (user_id, property_id)
);

ALTER TABLE public.user_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY shortlists_select_own
  ON public.user_shortlists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY shortlists_insert_own
  ON public.user_shortlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_verified());

CREATE POLICY shortlists_delete_own
  ON public.user_shortlists
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY shortlists_select_admin
  ON public.user_shortlists
  FOR SELECT
  USING (public.is_admin());
