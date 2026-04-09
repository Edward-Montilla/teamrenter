-- Slice 50 Phase 3: benchmark_averages table

CREATE TABLE public.benchmark_averages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('city', 'neighbourhood')),
  scope_value text NOT NULL,
  neighbourhood_id uuid REFERENCES public.neighbourhoods(id) ON DELETE CASCADE,
  avg_management_responsiveness numeric(3,2),
  avg_maintenance_timeliness numeric(3,2),
  avg_listing_accuracy numeric(3,2),
  avg_fee_transparency numeric(3,2),
  avg_lease_clarity numeric(3,2),
  avg_trust_score numeric(3,2),
  property_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT benchmark_averages_scope_unique UNIQUE (scope_type, scope_value)
);

ALTER TABLE public.benchmark_averages ENABLE ROW LEVEL SECURITY;

CREATE POLICY benchmarks_select_public
  ON public.benchmark_averages
  FOR SELECT
  USING (true);

CREATE POLICY benchmarks_insert_admin
  ON public.benchmark_averages
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY benchmarks_update_admin
  ON public.benchmark_averages
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY benchmarks_delete_admin
  ON public.benchmark_averages
  FOR DELETE
  USING (public.is_admin());
