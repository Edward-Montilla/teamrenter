-- Slice 50 Phase 3: portfolio_properties table

CREATE TABLE public.portfolio_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portfolio_properties_unique UNIQUE (user_id, property_id)
);

ALTER TABLE public.portfolio_properties ENABLE ROW LEVEL SECURITY;

-- Landlord can see own portfolio; team members can see their owner's portfolio
CREATE POLICY portfolio_select_own
  ON public.portfolio_properties
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.owner_user_id = portfolio_properties.user_id
        AND tm.member_user_id = auth.uid()
        AND tm.accepted_at IS NOT NULL
    )
  );

CREATE POLICY portfolio_insert_admin
  ON public.portfolio_properties
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY portfolio_delete_admin
  ON public.portfolio_properties
  FOR DELETE
  USING (public.is_admin());

CREATE POLICY portfolio_select_admin
  ON public.portfolio_properties
  FOR SELECT
  USING (public.is_admin());
