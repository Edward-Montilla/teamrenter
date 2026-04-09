-- Slice 50 Phase 3: neighbourhoods table + properties FK
-- Additive only — does not modify existing columns.

CREATE TABLE public.neighbourhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  description text,
  property_count integer NOT NULL DEFAULT 0,
  avg_trust_score numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT neighbourhoods_name_city_unique UNIQUE (name, city)
);

CREATE TRIGGER neighbourhoods_set_updated_at
  BEFORE UPDATE ON public.neighbourhoods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.properties
  ADD COLUMN neighbourhood_id uuid REFERENCES public.neighbourhoods(id) ON DELETE SET NULL;

CREATE INDEX idx_properties_neighbourhood ON public.properties (neighbourhood_id);

ALTER TABLE public.neighbourhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY neighbourhoods_select_public
  ON public.neighbourhoods
  FOR SELECT
  USING (true);

CREATE POLICY neighbourhoods_insert_admin
  ON public.neighbourhoods
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY neighbourhoods_update_admin
  ON public.neighbourhoods
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY neighbourhoods_delete_admin
  ON public.neighbourhoods
  FOR DELETE
  USING (public.is_admin());
