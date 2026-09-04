import { useEffect, useState } from "react";
import { ArrowUpRight, Pause, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroClock, useNow } from "@/components/clock";
import { FocusRing } from "@/components/focus-ring";
import { haptic } from "@/lib/haptics";
import {
  intentionForToday,
  ritualsDoneToday,
  useNorth,
} from "@/lib/store";

const FOCUS_OPTIONS = [5, 15, 25];

export function TodayScreen() {
  const name = useNorth((s) => s.name);
  const hydrated = useNorth((s) => s.hydrated);
  const setName = useNorth((s) => s.setName);
  const intention = useNorth((s) => intentionForToday(s));
  const setIntention = useNorth((s) => s.setIntention);
  const rituals = useNorth((s) => s.rituals);
  const notes = useNorth((s) => s.notes);
  const setTab = useNorth((s) => s.setTab);
  const focusMinutes = useNorth((s) => s.focusMinutes);
  const setFocusMinutes = useNorth((s) => s.setFocusMinutes);
  const focusEndsAt = useNorth((s) => s.focusEndsAt);
  const startFocus = useNorth((s) => s.startFocus);
  const stopFocus = useNorth((s) => s.stopFocus);
  const now = useNow();
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    setDraft(intention);
  }, [intention]);

  const totalMs = focusMinutes * 60 * 1000;
  const remainingMs = focusEndsAt && now ? Math.max(0, focusEndsAt - now.getTime()) : totalMs;
  const running = Boolean(focusEndsAt && remainingMs > 0);
  const progress = running ? 1 - remainingMs / totalMs : 0;
  const doneCount = ritualsDoneToday(rituals);
  const latest = notes[0];

  useEffect(() => {
    if (focusEndsAt && now && now.getTime() >= focusEndsAt) {
      stopFocus();
      haptic("success");
    }
  }, [focusEndsAt, now, stopFocus]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <HeroClock name={name} />

      {hydrated && !name ? (
        <form
          className="rounded-3xl bg-paper p-4 pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setName(nameDraft);
            haptic("light");
          }}
        >
          <label htmlFor="north-name" className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
            What should I call you?
          </label>
          <div className="mt-3 flex min-w-0 gap-2">
            <input
              id="north-name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your first name"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-base text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-forest/30"
              autoComplete="given-name"
            />
            <Button type="submit" size="sm" className="shrink-0" disabled={!nameDraft.trim()}>
              Save
            </Button>
          </div>
        </form>
      ) : null}

      <section className="rounded-3xl bg-paper p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Today’s heading</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setIntention(draft)}
          rows={2}
          placeholder="One sentence that would make today true."
          className="mt-3 w-full resize-none bg-transparent font-display text-xl leading-snug font-medium tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="flex flex-col rounded-3xl bg-paper p-4">
          <div className="mb-3 flex items-center gap-2 text-muted">
            <Timer className="size-4" strokeWidth={1.8} />
            <span className="text-xs font-medium tracking-[0.14em] uppercase">Focus</span>
          </div>
          <div className="flex justify-center py-1">
            <FocusRing
              size={124}
              progress={progress}
              remaining={Math.round(remainingMs / 1000)}
              running={running}
            />
          </div>
          <div className="mt-2 flex justify-center gap-1">
            {FOCUS_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setFocusMinutes(m);
                  haptic("light");
                }}
                className={`h-8 min-w-10 rounded-full px-2 text-xs font-medium tabular-nums ${
                  focusMinutes === m ? "bg-forest text-forest-fg" : "text-muted"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <Button
            className="mt-3 w-full"
            variant={running ? "soft" : "primary"}
            size="sm"
            onClick={() => {
              if (running) stopFocus();
              else startFocus();
              haptic(running ? "warn" : "light");
            }}
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? "Stop" : "Start"}
          </Button>
        </section>

        <button
          type="button"
          onClick={() => setTab("rituals")}
          className="flex flex-col rounded-3xl bg-paper p-4 text-left"
        >
          <div className="mb-3 flex items-center justify-between text-muted">
            <span className="text-xs font-medium tracking-[0.14em] uppercase">Rituals</span>
            <ArrowUpRight className="size-4" />
          </div>
          <p className="font-display text-4xl leading-none font-medium tracking-[-0.04em] text-ink tabular-nums">
            {doneCount}
            <span className="text-lg text-muted">/{rituals.length}</span>
          </p>
          <p className="mt-auto pt-6 text-sm leading-snug text-muted">
            {doneCount === rituals.length
              ? "The day is marked."
              : "Small acts, kept."}
          </p>
        </button>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Latest note</p>
          <button
            type="button"
            onClick={() => setTab("notes")}
            className="text-sm font-medium text-forest"
          >
            Open notes
          </button>
        </div>
        {latest ? (
          <button
            type="button"
            onClick={() => setTab("notes")}
            className="w-full overflow-hidden rounded-3xl bg-paper text-left"
          >
            {latest.photo ? (
              <img
                src={latest.photo}
                alt=""
                className="h-36 w-full object-cover"
              />
            ) : null}
            <div className="p-4">
              <p className="text-sm leading-relaxed text-ink">
                {latest.text || "A captured still."}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setTab("notes")}
            className="w-full rounded-3xl border border-dashed border-line bg-paper/60 px-4 py-8 text-center text-sm text-muted"
          >
            Capture a line or a frame.
          </button>
        )}
      </section>

      <button
        type="button"
        onClick={() => setTab("device")}
        className="flex items-center justify-between rounded-3xl bg-forest px-5 py-4 text-left text-forest-fg"
      >
        <div>
          <p className="text-sm font-medium">Put North on your phone</p>
          <p className="mt-1 text-xs text-forest-fg/70">iPhone or Android. No Mac.</p>
        </div>
        <ArrowUpRight className="size-5" />
      </button>
    </div>
  );
}
