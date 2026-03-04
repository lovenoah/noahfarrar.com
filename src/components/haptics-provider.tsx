"use client";

import { createContext, useContext } from "react";
import { useWebHaptics } from "web-haptics/react";

type HapticsContext = {
  trigger: ReturnType<typeof useWebHaptics>["trigger"];
};

const HapticsContext = createContext<HapticsContext | null>(null);

export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const { trigger } = useWebHaptics();

  return (
    <HapticsContext.Provider value={{ trigger }}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  const ctx = useContext(HapticsContext);
  if (!ctx) throw new Error("useHaptics must be used within HapticsProvider");
  return ctx;
}
