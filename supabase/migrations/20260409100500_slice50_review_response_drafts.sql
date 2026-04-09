-- Slice 50 Phase 3: review_response_drafts table

CREATE TABLE public.review_response_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one approved response per review
CREATE UNIQUE INDEX idx_review_response_drafts_approved
  ON public.review_response_drafts (review_id)
  WHERE status = 'approved';

CREATE TRIGGER review_response_drafts_set_updated_at
  BEFORE UPDATE ON public.review_response_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.review_response_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY response_insert_landlord
  ON public.review_response_drafts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_user_id
    AND EXISTS (
      SELECT 1
      FROM public.reviews r
      JOIN public.portfolio_properties pp ON pp.property_id = r.property_id
      WHERE r.id = review_response_drafts.review_id
        AND (
          pp.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.owner_user_id = pp.user_id
              AND tm.member_user_id = auth.uid()
              AND tm.accepted_at IS NOT NULL
          )
        )
    )
  );

CREATE POLICY response_select_own
  ON public.review_response_drafts
  FOR SELECT
  USING (auth.uid() = author_user_id);

CREATE POLICY response_select_public_approved
  ON public.review_response_drafts
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY response_update_admin
  ON public.review_response_drafts
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY response_select_admin
  ON public.review_response_drafts
  FOR SELECT
  USING (public.is_admin());
