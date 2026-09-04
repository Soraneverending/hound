import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { localDayKey } from "@/lib/dates";

export type TabId = "today" | "notes" | "rituals" | "device";

export type Note = {
  id: string;
  text: string;
  createdAt: number;
  photo?: string;
};

export type Ritual = {
  id: string;
  title: string;
  hint: string;
  doneDates: string[];
};

export type NorthState = {
  hydrated: boolean;
  tab: TabId;
  name: string;
  intention: string;
  intentionDay: string;
  notes: Note[];
  rituals: Ritual[];
  focusMinutes: number;
  focusEndsAt: number | null;
  setHydrated: (value: boolean) => void;
  setTab: (tab: TabId) => void;
  setName: (name: string) => void;
  setIntention: (text: string) => void;
  addNote: (text: string, photo?: string) => void;
  removeNote: (id: string) => void;
  toggleRitual: (id: string) => void;
  setFocusMinutes: (minutes: number) => void;
  startFocus: () => void;
  stopFocus: () => void;
};

const DEFAULT_RITUALS: Ritual[] = [
  { id: "light", title: "Morning light", hint: "Face a window for a minute", doneDates: [] },
  { id: "move", title: "Move the body", hint: "A walk, a stretch, a flight of stairs", doneDates: [] },
  { id: "write", title: "One true sentence", hint: "Put one honest line in Notes", doneDates: [] },
  { id: "close", title: "Close the day", hint: "Name one thing that was enough", doneDates: [] },
];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNorth = create<NorthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      tab: "today",
      name: "",
      intention: "",
      intentionDay: "",
      notes: [],
      rituals: DEFAULT_RITUALS,
      focusMinutes: 25,
      focusEndsAt: null,
      setHydrated: (value) => set({ hydrated: value }),
      setTab: (tab) => set({ tab }),
      setName: (name) => set({ name: name.slice(0, 32) }),
      setIntention: (text) =>
        set({
          intention: text.slice(0, 140),
          intentionDay: localDayKey(),
        }),
      addNote: (text, photo) => {
        const trimmed = text.trim().slice(0, 400);
        if (!trimmed && !photo) return;
        const note: Note = {
          id: uid(),
          text: trimmed,
          createdAt: Date.now(),
          photo,
        };
        set({ notes: [note, ...get().notes].slice(0, 40) });
      },
      removeNote: (id) => set({ notes: get().notes.filter((n) => n.id !== id) }),
      toggleRitual: (id) => {
        const day = localDayKey();
        set({
          rituals: get().rituals.map((ritual) => {
            if (ritual.id !== id) return ritual;
            const has = ritual.doneDates.includes(day);
            return {
              ...ritual,
              doneDates: has
                ? ritual.doneDates.filter((d) => d !== day)
                : [...ritual.doneDates, day].slice(-60),
            };
          }),
        });
      },
      setFocusMinutes: (minutes) => set({ focusMinutes: minutes, focusEndsAt: null }),
      startFocus: () => {
        const ms = get().focusMinutes * 60 * 1000;
        set({ focusEndsAt: Date.now() + ms });
      },
      stopFocus: () => set({ focusEndsAt: null }),
    }),
    {
      name: "north-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        name: state.name,
        intention: state.intention,
        intentionDay: state.intentionDay,
        notes: state.notes,
        rituals: state.rituals,
        focusMinutes: state.focusMinutes,
        focusEndsAt: state.focusEndsAt,
      }),
    },
  ),
);

export function intentionForToday(state: Pick<NorthState, "intention" | "intentionDay">) {
  return state.intentionDay === localDayKey() ? state.intention : "";
}

export function ritualsDoneToday(rituals: Ritual[]) {
  const day = localDayKey();
  return rituals.filter((r) => r.doneDates.includes(day)).length;
}

export function isRitualDoneToday(ritual: Ritual) {
  return ritual.doneDates.includes(localDayKey());
}
