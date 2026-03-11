"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { applyTheme, getStoredTheme } from "@/components/theme/ThemeSync";
import {
  APP_THEMES,
  DEFAULT_THEME_KEY,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/themes";
import { cn } from "@/lib/ui";

function ThemePreviewCell({
  theme,
  isCurrent,
  onSelect,
}: {
  theme: AppTheme;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isCurrent}
      className={cn(
        "rounded-2xl border p-3 text-left transition",
        "hover:border-zinc-300 hover:bg-zinc-50",
        isCurrent ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white",
      )}
    >
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: theme.tokens.neutralSupport }}
      >
        <div
          className="flex items-center justify-between border-b px-3 py-2"
          style={{
            backgroundColor: theme.tokens.surfaceCard,
            borderColor: theme.tokens.neutralSupport,
            color: theme.tokens.primaryText,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.tokens.primaryAccent }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.tokens.secondaryAccent }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: theme.tokens.softAccent }}
            />
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: theme.tokens.softAccent,
              color: theme.tokens.primaryText,
            }}
          >
            Sample
          </span>
        </div>

        <div
          className="space-y-3 p-3"
          style={{
            backgroundColor: theme.tokens.pageBg,
            color: theme.tokens.primaryText,
          }}
        >
          <div className="space-y-2">
            <div
              className="h-2.5 w-2/3 rounded-full"
              style={{ backgroundColor: theme.tokens.primaryText }}
            />
            <div
              className="h-2 w-1/2 rounded-full"
              style={{ backgroundColor: theme.tokens.mutedText }}
            />
          </div>

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-2">
            <div
              className="rounded-lg border p-2"
              style={{
                backgroundColor: theme.tokens.surfaceCard,
                borderColor: theme.tokens.neutralSupport,
              }}
            >
              <div
                className="h-2 w-3/4 rounded-full"
                style={{ backgroundColor: theme.tokens.mutedText }}
              />
              <div
                className="mt-2 h-5 w-full rounded-md"
                style={{ backgroundColor: theme.tokens.surfaceAlt }}
              />
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                backgroundColor: theme.tokens.primaryAccent,
                color: theme.tokens.primaryAccentText,
              }}
            >
              <div className="h-2 w-3/4 rounded-full bg-current opacity-65" />
              <div className="mt-2 h-5 w-full rounded-md bg-current opacity-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{theme.name}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
            {theme.description}
          </p>
        </div>
        {isCurrent ? (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Active
          </span>
        ) : null}
      </div>
    </button>
  );
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_THEME_KEY;
    }

    return getStoredTheme();
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        setCurrentTheme(getStoredTheme());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeTheme = useMemo(
    () => APP_THEMES.find((theme) => theme.key === currentTheme) ?? APP_THEMES[0],
    [currentTheme],
  );

  const handleSelect = (themeKey: AppTheme["key"]) => {
    applyTheme(themeKey);
    setCurrentTheme(themeKey);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Theme
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(42rem,calc(100vw-2rem))] rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-start justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold text-foreground">Choose a theme</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                Preview the look before switching. Saved on this device for anyone using it.
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {activeTheme.name}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {APP_THEMES.map((theme) => (
              <ThemePreviewCell
                key={theme.key}
                theme={theme}
                isCurrent={theme.key === currentTheme}
                onSelect={() => handleSelect(theme.key)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
