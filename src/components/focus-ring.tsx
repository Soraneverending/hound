import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function FocusRing({
  progress,
  remaining,
  running,
  size = 168,
}: {
  progress: number;
  remaining: number;
  running: boolean;
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = c * (1 - clamped);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-forest)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-display text-[2.4rem] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums",
          )}
        >
          {formatDuration(remaining)}
        </span>
        <span className="mt-2 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
          {running ? "Remaining" : "Ready"}
        </span>
      </div>
    </div>
  );
}
