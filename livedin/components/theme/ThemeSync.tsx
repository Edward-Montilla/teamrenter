"use client";

import { useEffect } from "react";
import {
  DEFAULT_THEME_KEY,
  isAppThemeKey,
  THEME_STORAGE_KEY,
  type AppThemeKey,
} from "@/lib/themes";

export function applyTheme(themeKey: AppThemeKey) {
  document.documentElement.dataset.theme = themeKey;
  document.documentElement.style.colorScheme = "light";
  window.localStorage.setItem(THEME_STORAGE_KEY, themeKey);
}

export function getStoredTheme(): AppThemeKey {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isAppThemeKey(stored) ? stored : DEFAULT_THEME_KEY;
}

export function ThemeSync() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    applyTheme(getStoredTheme());
    const syncTheme = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue;
      applyTheme(isAppThemeKey(nextTheme) ? nextTheme : DEFAULT_THEME_KEY);
    };

    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return null;
}
