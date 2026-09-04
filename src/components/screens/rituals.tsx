import { Check } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { isRitualDoneToday, ritualsDoneToday, useNorth } from "@/lib/store";

export function RitualsScreen() {
  const rituals = useNorth((s) => s.rituals);
  const toggleRitual = useNorth((s) => s.toggleRitual);
  const done = ritualsDoneToday(rituals);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header>
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Keep</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-[-0.03em] text-ink">
          Rituals
        </h1>
        <p className="mt-2 text-sm text-muted">
          {done} of {rituals.length} marked today
        </p>
      </header>

      <ul className="overflow-hidden rounded-3xl bg-paper">
        {rituals.map((ritual, index) => {
          const on = isRitualDoneToday(ritual);
          return (
            <li key={ritual.id} className={index !== 0 ? "border-t border-line" : undefined}>
              <button
                type="button"
                onClick={() => {
                  toggleRitual(ritual.id);
                  haptic(on ? "light" : "success");
                }}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                aria-pressed={on}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-[var(--motion-quick)]",
                    on
                      ? "border-forest bg-forest text-forest-fg"
                      : "border-line bg-bg text-transparent",
                  )}
                  aria-hidden="true"
                >
                  <Check className="size-5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-[15px] font-medium", on ? "text-sage" : "text-ink")}>
                    {ritual.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{ritual.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="px-1 text-sm leading-relaxed text-muted">
        Rituals reset at midnight on this phone. Nothing is uploaded. Mark them when they are true,
        not when they are perfect.
      </p>
    </div>
  );
}
