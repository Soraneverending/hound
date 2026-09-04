import { createJSONStorage } from "zustand/middleware";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

export function safeStorage() {
  try {
    const key = "__hound_probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

export const persistStorage = createJSONStorage(() => {
  if (typeof window === "undefined") return memoryStorage();
  return safeStorage();
});
