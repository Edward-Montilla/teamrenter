-- Slice 50 Phase 3: team_members table

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_email text NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_members_unique UNIQUE (owner_user_id, member_user_id),
  CONSTRAINT team_members_no_self CHECK (owner_user_id != member_user_id)
);

CREATE TRIGGER team_members_set_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_select_own
  ON public.team_members
  FOR SELECT
  USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

CREATE POLICY team_insert_owner
  ON public.team_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'landlord'
    )
  );

CREATE POLICY team_update_owner
  ON public.team_members
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY team_delete_owner
  ON public.team_members
  FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE POLICY team_crud_admin
  ON public.team_members
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
