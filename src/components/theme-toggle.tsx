import { cn } from "@/lib/cn";
import { THEMES, type ThemeId } from "@/lib/themes";
import { useHound } from "@/lib/hound-store";

export function ThemeToggle() {
  const theme = useHound((s) => s.theme);
  const setTheme = useHound((s) => s.setTheme);
  return (
    <div className="flex items-center gap-1 rounded-full bg-paper p-1 shadow-[var(--shadow-card)]" role="radiogroup" aria-label="Look">
      {THEMES.map((look) => {
        const on = theme === look.id;
        return (
          <button
            key={look.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={look.label}
            title={look.label}
            onClick={() => setTheme(look.id as ThemeId)}
            className={cn(
              "theme-swatch flex size-7 items-center justify-center rounded-full",
              on ? "ring-2 ring-ink ring-offset-2 ring-offset-bg" : "opacity-80",
            )}
            data-look={look.id}
          />
        );
      })}
    </div>
  );
}
