import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

const TONE: Record<Category, string> = {
  games: "bg-accent text-accent-fg",
  groceries: "bg-good text-good-fg",
  clothes: "bg-ink text-accent-fg",
  electronics: "bg-paper text-ink shadow-[var(--shadow-card)]",
  pharmacy: "bg-paper text-ink shadow-[var(--shadow-card)]",
  home: "bg-muted text-accent-fg",
  books: "bg-paper text-ink shadow-[var(--shadow-card)]",
  collectibles: "bg-accent text-accent-fg",
  cars: "bg-ink text-accent-fg",
  beauty: "bg-good text-good-fg",
};

export function ProductCover({
  name,
  brand,
  category,
  src,
  className,
  fit = "cover",
  eager = false,
}: {
  name: string;
  brand: string;
  category: Category;
  src?: string;
  className?: string;
  fit?: "cover" | "contain";
  eager?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const mark = (brand || name).slice(0, 1).toUpperCase();
  const show = Boolean(src) && !broken;
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-xl pointer-events-none",
        show ? "bg-paper" : TONE[category],
        className,
      )}
      aria-hidden
    >
      {show ? (
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "pointer-events-none absolute inset-0 size-full select-none outline outline-1 -outline-offset-1 outline-ink/10",
            fit === "contain" ? "object-contain" : "object-cover",
          )}
          decoding="async"
          loading={eager ? "eager" : "lazy"}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="pointer-events-none font-display text-xl leading-none">{mark}</span>
      )}
    </div>
  );
}
