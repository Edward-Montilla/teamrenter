"use client";

import { useEffect } from "react";
import {
  DEFAULT_THEME_KEY,
  isAppThemeKey,
  THEME_STORAGE_KEY,
  type AppThemeKey,
} from "@/lib/themes";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ThemeProfile = {
  theme_key: string | null;
};

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

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;

    const syncTheme = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active || !session?.user) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("theme_key")
        .eq("user_id", session.user.id)
        .maybeSingle<ThemeProfile>();

      if (!active) {
        return;
      }

      const nextTheme =
        !error && isAppThemeKey(data?.theme_key)
          ? data.theme_key
          : getStoredTheme();

      applyTheme(nextTheme);
    };

    void syncTheme();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncTheme();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
