"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const GATE_STORAGE_KEY = "review_gate_mock_v1";

export type MockGateToggles = {
  authenticated: boolean;
  email_verified: boolean;
  limit_reached: boolean;
  already_reviewed: boolean;
};

function loadToggles(): MockGateToggles {
  if (typeof window === "undefined") {
    return {
      authenticated: true,
      email_verified: true,
      limit_reached: false,
      already_reviewed: false,
    };
  }
  try {
    const raw = window.localStorage.getItem(GATE_STORAGE_KEY);
    if (!raw) return defaultToggles();
    const parsed = JSON.parse(raw) as Partial<MockGateToggles>;
    if (parsed && typeof parsed === "object") {
      return {
        authenticated: Boolean(parsed.authenticated),
        email_verified: Boolean(parsed.email_verified),
        limit_reached: Boolean(parsed.limit_reached),
        already_reviewed: Boolean(parsed.already_reviewed),
      };
    }
  } catch {
    /* ignore */
  }
  return defaultToggles();
}

function defaultToggles(): MockGateToggles {
  return {
    authenticated: true,
    email_verified: true,
    limit_reached: false,
    already_reviewed: false,
  };
}

function saveToggles(t: MockGateToggles) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GATE_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

type MockGateContextValue = {
  toggles: MockGateToggles;
  setAuthenticated: (v: boolean) => void;
  setEmailVerified: (v: boolean) => void;
  setLimitReached: (v: boolean) => void;
  setAlreadyReviewed: (v: boolean) => void;
};

const MockGateContext = createContext<MockGateContextValue | null>(null);

export function useMockGate(): MockGateContextValue {
  const ctx = useContext(MockGateContext);
  if (!ctx) {
    return {
      toggles: defaultToggles(),
      setAuthenticated: () => {},
      setEmailVerified: () => {},
      setLimitReached: () => {},
      setAlreadyReviewed: () => {},
    };
  }
  return ctx;
}

export function MockGateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toggles, setToggles] = useState<MockGateToggles>(loadToggles);

  const update = useCallback((patch: Partial<MockGateToggles>) => {
    setToggles((prev) => {
      const next = { ...prev, ...patch };
      saveToggles(next);
      return next;
    });
  }, []);

  const value = useMemo<MockGateContextValue>(
    () => ({
      toggles,
      setAuthenticated: (v) => update({ authenticated: v }),
      setEmailVerified: (v) => update({ email_verified: v }),
      setLimitReached: (v) => update({ limit_reached: v }),
      setAlreadyReviewed: (v) => update({ already_reviewed: v }),
    }),
    [toggles, update]
  );

  return (
    <MockGateContext.Provider value={value}>{children}</MockGateContext.Provider>
  );
}

export function MockGatePanel() {
  const { toggles, setAuthenticated, setEmailVerified, setLimitReached, setAlreadyReviewed } =
    useMockGate();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-amber-300 bg-amber-50 p-3 shadow-lg dark:border-amber-600 dark:bg-amber-950/50"
      aria-label="Mock gate toggles (dev only)"
    >
      <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
        Mock gate (dev)
      </p>
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.authenticated}
            onChange={(e) => setAuthenticated(e.target.checked)}
          />
          <span className="text-foreground">Authenticated</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.email_verified}
            onChange={(e) => setEmailVerified(e.target.checked)}
          />
          <span className="text-foreground">Email verified</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.limit_reached}
            onChange={(e) => setLimitReached(e.target.checked)}
          />
          <span className="text-foreground">Limit reached</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={toggles.already_reviewed}
            onChange={(e) => setAlreadyReviewed(e.target.checked)}
          />
          <span className="text-foreground">Already reviewed</span>
        </label>
      </div>
    </div>
  );
}
