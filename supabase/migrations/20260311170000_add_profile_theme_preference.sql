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
