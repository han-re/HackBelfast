"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ProPageMeta {
  title: string;
  breadcrumb: string[];
}

interface Ctx {
  meta: ProPageMeta;
  setMeta: (m: ProPageMeta) => void;
}

const ProPageCtx = createContext<Ctx | null>(null);

export function ProPageProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<ProPageMeta>({
    title: "VoteWise Pro",
    breadcrumb: [],
  });
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return <ProPageCtx.Provider value={value}>{children}</ProPageCtx.Provider>;
}

export function useProPage() {
  const ctx = useContext(ProPageCtx);
  if (!ctx) {
    throw new Error("useProPage must be used inside ProPageProvider (under /pro)");
  }
  return ctx;
}

export function useSetProPage(title: string, breadcrumb: string[] = []) {
  const { setMeta } = useProPage();
  const breadcrumbKey = breadcrumb.join("|");
  useEffect(() => {
    setMeta({ title, breadcrumb });
  }, [title, breadcrumbKey, setMeta]);
}
