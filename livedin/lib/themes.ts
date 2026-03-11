export const THEME_STORAGE_KEY = "livedin-theme";
export const DEFAULT_THEME_KEY = "recommended";

export type AppThemeKey =
  | "recommended"
  | "ink-blue-peach-pop"
  | "forest-charcoal"
  | "navy-digital-sky"
  | "aubergine-rose";

export type AppTheme = {
  key: AppThemeKey;
  name: string;
  description: string;
  tokens: {
    primaryText: string;
    pageBg: string;
    surfaceCard: string;
    surfaceAlt: string;
    primaryAccent: string;
    primaryAccentText: string;
    softAccent: string;
    secondaryAccent: string;
    neutralSupport: string;
    mutedText: string;
  };
};

export const APP_THEMES: AppTheme[] = [
  {
    key: "recommended",
    name: "Recommended",
    description: "Purple + teal + neutral slate",
    tokens: {
      primaryText: "#1F2937",
      pageBg: "#F3F4F6",
      surfaceCard: "#FFFFFF",
      surfaceAlt: "#DDD6FE",
      primaryAccent: "#8B5CF6",
      primaryAccentText: "#FFFFFF",
      softAccent: "#DDD6FE",
      secondaryAccent: "#14B8A6",
      neutralSupport: "#D1D5DB",
      mutedText: "#6B7280",
    },
  },
  {
    key: "ink-blue-peach-pop",
    name: "Ink Blue + Peach Pop + Sand",
    description: "Editorial, warm, and lifestyle-forward",
    tokens: {
      primaryText: "#1E2A38",
      pageBg: "#FFF8F2",
      surfaceCard: "#F5E9DA",
      surfaceAlt: "#FFF1E6",
      primaryAccent: "#FF8A65",
      primaryAccentText: "#FFFFFF",
      softAccent: "#FFE0D3",
      secondaryAccent: "#FF8A65",
      neutralSupport: "#D6C1AF",
      mutedText: "#7C7C82",
    },
  },
  {
    key: "forest-charcoal",
    name: "Forest Charcoal + Acid Lime + Bone",
    description: "Bold and higher-contrast with a lime accent",
    tokens: {
      primaryText: "#1F2A24",
      pageBg: "#F6F2E8",
      surfaceCard: "#FFFFFF",
      surfaceAlt: "#D9C7B8",
      primaryAccent: "#B7F34D",
      primaryAccentText: "#1F2A24",
      softAccent: "#E6F4C6",
      secondaryAccent: "#7A8577",
      neutralSupport: "#C6B8AB",
      mutedText: "#7A8577",
    },
  },
  {
    key: "navy-digital-sky",
    name: "Navy + Digital Sky + Blush",
    description: "Trust-first with light blue energy",
    tokens: {
      primaryText: "#243B53",
      pageBg: "#FAFAF9",
      surfaceCard: "#FFFFFF",
      surfaceAlt: "#FBCFE8",
      primaryAccent: "#38BDF8",
      primaryAccentText: "#0F172A",
      softAccent: "#FBCFE8",
      secondaryAccent: "#38BDF8",
      neutralSupport: "#CBD5E1",
      mutedText: "#94A3B8",
    },
  },
  {
    key: "aubergine-rose",
    name: "Aubergine + Rose + Silver Fog",
    description: "Brand-forward with softer pink highlights",
    tokens: {
      primaryText: "#3C2541",
      pageBg: "#FAF7F5",
      surfaceCard: "#FFFFFF",
      surfaceAlt: "#F4E5EA",
      primaryAccent: "#E9A6B3",
      primaryAccentText: "#3C2541",
      softAccent: "#F4E5EA",
      secondaryAccent: "#7E6C77",
      neutralSupport: "#E5E7EB",
      mutedText: "#7E6C77",
    },
  },
];

const APP_THEME_KEYS = new Set<AppThemeKey>(APP_THEMES.map((theme) => theme.key));

export function isAppThemeKey(value: string | null | undefined): value is AppThemeKey {
  return Boolean(value && APP_THEME_KEYS.has(value as AppThemeKey));
}

export function getThemeByKey(themeKey: string | null | undefined): AppTheme {
  if (!isAppThemeKey(themeKey)) {
    return APP_THEMES[0];
  }

  return APP_THEMES.find((theme) => theme.key === themeKey) ?? APP_THEMES[0];
}

export function themeScript(): string {
  const keys = JSON.stringify(APP_THEMES.map((theme) => theme.key));
  return `try {
    const keys = new Set(${keys});
    const stored = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const theme = stored && keys.has(stored) ? stored : ${JSON.stringify(DEFAULT_THEME_KEY)};
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = "light";
  } catch (_error) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME_KEY)};
    document.documentElement.style.colorScheme = "light";
  }`;
}
