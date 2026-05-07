// Supabase-backed data layer with localStorage cache for offline/instant reads.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "soviet-strength-data-v1";
const MIGRATION_KEY = "soviet-strength-migrations";
const UPLOADED_KEY = "soviet-strength-uploaded";

export type DietEntry = {
  id: string;
  date: string;
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
  /** Personal max reps. Routine reps = round(maxReps * 0.5). 0 = unset. */
  maxReps: number;
};

export type ZaryadkaSession = {
  id: string;
  date: string;
  completed: boolean;
  duration: number;
  energyBefore: number;
  energyAfter: number;
  movements: string[];
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

function normalize(parsed: any): Store {
  const merged: Store = { ...empty, ...parsed };
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
  return merged;
}

function loadLocal(): Store {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const merged = normalize(JSON.parse(raw));
    try {
      const ran = JSON.parse(localStorage.getItem(MIGRATION_KEY) || "[]") as string[];
      if (!ran.includes("zaryadka-sets-3")) {
        merged.zaryadkaExercises = merged.zaryadkaExercises.map((x) => ({ ...x, targetSets: 3 }));
        localStorage.setItem(MIGRATION_KEY, JSON.stringify([...ran, "zaryadka-sets-3"]));
        localStorage.setItem(KEY, JSON.stringify(merged));
      }
    } catch {
      // ignore
    }
    return merged;
  } catch {
    return empty;
  }
}

function saveLocal(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("soviet-store-update"));
}

// Backwards-compat exports (some code may still call these)
export const loadStore = loadLocal;
export const saveStore = saveLocal;

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function isEmptyStore(s: Store): boolean {
  return (
    s.diet.length === 0 &&
    s.water.length === 0 &&
    s.pushups.length === 0 &&
    s.maxTests.length === 0 &&
    s.zaryadka.length === 0
  );
}

async function fetchRemote(userId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[store] fetch failed", error);
    return null;
  }
  if (!data) return null;
  return normalize(data.data ?? {});
}

async function pushRemote(userId: string, s: Store) {
  const { error } = await supabase
    .from("user_data")
    .upsert({ user_id: userId, data: s as any }, { onConflict: "user_id" });
  if (error) console.error("[store] save failed", error);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRemoteSave(userId: string, s: Store) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => pushRemote(userId, s), 600);
}

export function useStore() {
  const [store, setStore] = useState<Store>(() => loadLocal());
  const [userId, setUserId] = useState<string | null>(null);

  // Track auth user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pull from remote on login; merge local-only data once
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchRemote(userId);
      if (cancelled) return;
      const local = loadLocal();
      const uploadedKey = `${UPLOADED_KEY}:${userId}`;
      const alreadyUploaded = localStorage.getItem(uploadedKey) === "1";

      if (!remote || isEmptyStore(remote)) {
        // First sync — upload local data (if any) so it's not lost
        if (!isEmptyStore(local) && !alreadyUploaded) {
          await pushRemote(userId, local);
          localStorage.setItem(uploadedKey, "1");
          setStore(local);
        } else {
          setStore(remote ?? empty);
          saveLocal(remote ?? empty);
        }
      } else {
        // Remote wins on subsequent loads
        setStore(remote);
        saveLocal(remote);
        localStorage.setItem(uploadedKey, "1");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // React to local cache changes from other tabs / setters
  useEffect(() => {
    const h = () => setStore(loadLocal());
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
      const next = updater(loadLocal());
      saveLocal(next);
      setStore(next);
      if (userId) scheduleRemoteSave(userId, next);
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
