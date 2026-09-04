import { useEffect, type ReactNode } from "react";
import { useNorth } from "@/lib/store";

export function HydrateNorth({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) useNorth.getState().setHydrated(true);
    };
    const t = window.setTimeout(finish, 0);
    void Promise.resolve(useNorth.persist.rehydrate()).finally(finish);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return children;
}
