"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  fallbackNavigationSnapshot,
  type PublicNavigationSnapshot
} from "../lib/navigation";

const PublicNavigationContext = createContext<PublicNavigationSnapshot>(fallbackNavigationSnapshot);

export function PublicNavigationProvider({
  initialSnapshot,
  children
}: {
  initialSnapshot: PublicNavigationSnapshot;
  children: ReactNode;
}) {
  return (
    <PublicNavigationContext.Provider value={initialSnapshot}>
      {children}
    </PublicNavigationContext.Provider>
  );
}

export function usePublicNavigationSnapshot() {
  return useContext(PublicNavigationContext);
}
