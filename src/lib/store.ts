// Local-storage backed data layer for the tracker.
const KEY = "soviet-strength-data-v1";

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

export type ZaryadkaExercise = { name: string; targetSets: number };

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
  { name: "Neck rotations", targetSets: 1 },
  { name: "Shoulder circles", targetSets: 1 },
  { name: "Arm swings", targetSets: 2 },
  { name: "Torso twists", targetSets: 2 },
  { name: "Hip circles", targetSets: 2 },
  { name: "Squats", targetSets: 3 },
  { name: "Push-ups", targetSets: 3 },
  { name: "Light jogging in place", targetSets: 1 },
  { name: "Deep breathing", targetSets: 1 },
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
    // Migrate legacy string[] exercises → {name,targetSets}[]
    if (Array.isArray(merged.zaryadkaExercises) && merged.zaryadkaExercises.length > 0 && typeof (merged.zaryadkaExercises[0] as unknown) === "string") {
      merged.zaryadkaExercises = (merged.zaryadkaExercises as unknown as string[]).map((name) => {
        const def = DEFAULT_ZARYADKA_EXERCISES.find((d) => d.name === name);
        return { name, targetSets: def?.targetSets ?? 1 };
      });
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
