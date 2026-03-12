DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'theme_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN theme_key text NOT NULL DEFAULT 'recommended'
    CHECK (
      theme_key IN (
        'recommended',
        'ink-blue-peach-pop',
        'forest-charcoal',
        'navy-digital-sky',
        'aubergine-rose'
      )
    );
  END IF;
END $$;
