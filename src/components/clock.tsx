import { useEffect, useState } from "react";
import { formatClockParts, formatLongDate, greetingFor } from "@/lib/dates";

export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

export function HeroClock({ name }: { name: string }) {
  const now = useNow();
  const { hour, minute, dayPeriod } = formatClockParts(now);
  const greet = greetingFor(now);
  const who = name.trim();

  return (
    <div suppressHydrationWarning>
      <p className="text-sm font-medium text-muted">
        {greet}
        {who ? `, ${who}` : ""}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="font-display text-clock leading-[0.9] font-medium tracking-[-0.04em] text-ink tabular-nums">
          {hour}
          <span className="text-sage">:</span>
          {minute}
        </p>
        <span className="mb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">
          {dayPeriod}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">{formatLongDate(now)}</p>
    </div>
  );
}
