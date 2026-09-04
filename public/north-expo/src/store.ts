import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export type NorthData = {
  name: string;
  intention: string;
  intentionDay: string;
  notes: Note[];
  rituals: Ritual[];
  focusMinutes: number;
};

const KEY = "north-v1";

export const DEFAULT_RITUALS: Ritual[] = [
  { id: "light", title: "Morning light", hint: "Face a window for a minute", doneDates: [] },
  { id: "move", title: "Move the body", hint: "A walk, a stretch, a flight of stairs", doneDates: [] },
  { id: "write", title: "One true sentence", hint: "Put one honest line in Notes", doneDates: [] },
  { id: "close", title: "Close the day", hint: "Name one thing that was enough", doneDates: [] },
];

const EMPTY: NorthData = {
  name: "",
  intention: "",
  intentionDay: "",
  notes: [],
  rituals: DEFAULT_RITUALS,
  focusMinutes: 25,
};

export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNorthStorage() {
  const [data, setData] = useState<NorthData>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<NorthData>;
          setData({
            ...EMPTY,
            ...parsed,
            rituals: parsed.rituals?.length ? parsed.rituals : DEFAULT_RITUALS,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  function commit(next: NorthData) {
    setData(next);
    void AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  return { data, ready, commit };
}
