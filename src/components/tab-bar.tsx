import { LayoutGrid, MessageCircle, Pin, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import { useHound } from "@/lib/hound-store";

const TABS = [
  { id: "hunt" as const, label: "Hunt", icon: ScanLine },
  { id: "pins" as const, label: "Pins", icon: Pin },
  { id: "aisles" as const, label: "Aisles", icon: LayoutGrid },
  { id: "board" as const, label: "Notes", icon: MessageCircle },
];

export function TabBar() {
  const tab = useHound((s) => s.tab);
  const setTab = useHound((s) => s.setTab);
  const unread = useHound((s) => (s.pings ?? []).filter((p) => !p.read).length);

  return (
    <nav
      className="tab-bar grid shrink-0 grid-cols-4 border-t border-line bg-bg px-1 pt-1"
      style={{ paddingBottom: "max(10px, var(--hound-bottom-clear, env(safe-area-inset-bottom, 0px)))" }}
      aria-label="Main"
    >
      {TABS.map((item) => {
        const active = tab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium tracking-wide",
              active ? "text-ink" : "text-faint",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="relative">
              <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} />
              {item.id === "pins" && unread > 0 ? (
                <span className="absolute -top-1 -right-2 min-w-4 rounded-full bg-ink px-1 text-[9px] text-accent-fg tabular-nums">
                  {unread}
                </span>
              ) : null}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
