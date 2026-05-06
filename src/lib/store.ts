// Local-storage backed data layer for the tracker.
const KEY = "soviet-strength-data-v1";
const MIGRATION_KEY = "soviet-strength-migrations";

export type DietEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  meal: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
};

export type WaterEntry = { date: string; ml: number };

export type PushupSet = {
  id: string;
  date: string;
  setNumber: number;
  reps: number;
  effort: number;
  notes?: string;
};

export type MaxTest = { id: string; date: string; reps: number };

export type ZaryadkaExercise = {
  name: string;
  targetSets: number;
  /** Personal max reps for this exercise. Routine reps = round(maxReps * 0.5). 0 = unset. */
  maxReps: number;
};

export type ZaryadkaSession = {
  id: string;
  date: string;
  completed: boolean;
  duration: number;
  energyBefore: number;
  energyAfter: number;
  /** legacy: list of completed movement names (kept for backward compat) */
  movements: string[];
  /** map of exercise name → sets completed today */
  setsDone?: Record<string, number>;
  notes?: string;
};

export type Store = {
  diet: DietEntry[];
  water: WaterEntry[];
  pushups: PushupSet[];
  maxTests: MaxTest[];
  zaryadka: ZaryadkaSession[];
  zaryadkaExercises: ZaryadkaExercise[];
};

export const DEFAULT_ZARYADKA_EXERCISES: ZaryadkaExercise[] = [
  { name: "Neck rotations", targetSets: 3, maxReps: 20 },
  { name: "Shoulder circles", targetSets: 3, maxReps: 20 },
  { name: "Arm swings", targetSets: 3, maxReps: 30 },
  { name: "Torso twists", targetSets: 3, maxReps: 30 },
  { name: "Hip circles", targetSets: 3, maxReps: 20 },
  { name: "Squats", targetSets: 3, maxReps: 0 },
  { name: "Push-ups", targetSets: 3, maxReps: 0 },
  { name: "Light jogging in place", targetSets: 3, maxReps: 0 },
  { name: "Deep breathing", targetSets: 3, maxReps: 10 },
];

const empty: Store = {
  diet: [],
  water: [],
  pushups: [],
  maxTests: [],
  zaryadka: [],
  zaryadkaExercises: DEFAULT_ZARYADKA_EXERCISES,
};

export function loadStore(): Store {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const merged: Store = { ...empty, ...parsed };
    // Migrate legacy formats: string[] or {name,targetSets}[] → ZaryadkaExercise[]
    if (Array.isArray(merged.zaryadkaExercises)) {
      merged.zaryadkaExercises = (merged.zaryadkaExercises as unknown[]).map((item) => {
        if (typeof item === "string") {
          const def = DEFAULT_ZARYADKA_EXERCISES.find((d) => d.name === item);
          return { name: item, targetSets: def?.targetSets ?? 3, maxReps: def?.maxReps ?? 0 };
        }
        const it = item as Partial<ZaryadkaExercise>;
        const def = DEFAULT_ZARYADKA_EXERCISES.find((d) => d.name === it.name);
        return {
          name: it.name ?? "",
          targetSets: it.targetSets ?? def?.targetSets ?? 3,
          maxReps: it.maxReps ?? def?.maxReps ?? 0,
        };
      });
    }
    // One-time migration: normalize all routine sets to 3
    try {
      const ran = JSON.parse(localStorage.getItem(MIGRATION_KEY) || "[]") as string[];
      if (!ran.includes("zaryadka-sets-3")) {
        merged.zaryadkaExercises = merged.zaryadkaExercises.map((x) => ({ ...x, targetSets: 3 }));
        localStorage.setItem(MIGRATION_KEY, JSON.stringify([...ran, "zaryadka-sets-3"]));
        localStorage.setItem(KEY, JSON.stringify(merged));
      }
    } catch {
      // ignore migration errors
    }
    return merged;
  } catch {
    return empty;
  }
}

export function saveStore(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("soviet-store-update"));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

import { useEffect, useState } from "react";

export function useStore() {
  const [store, setStore] = useState<Store>(() => loadStore());
  useEffect(() => {
    const h = () => setStore(loadStore());
    window.addEventListener("soviet-store-update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("soviet-store-update", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [
    store,
    (updater: (s: Store) => Store) => {
      const next = updater(loadStore());
      saveStore(next);
      setStore(next);
    },
  ] as const;
}

export function streak(dates: string[]): number {
  const set = new Set(dates);
  let n = 0;
  const d = new Date();
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
