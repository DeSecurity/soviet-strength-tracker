import { useState, useMemo } from "react";
import { useStore, todayStr, uid, DEFAULT_ZARYADKA_EXERCISES } from "@/lib/store";
import { toast } from "sonner";
import { Sunrise, Plus, X, Minus } from "lucide-react";

export default function Zaryadka() {
  const [store, set] = useStore();
  const t = todayStr();
  const existing = store.zaryadka.find((z) => z.date === t);

  const routine = store.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES;

  // Hydrate setsDone from existing session, with backward-compat from legacy `movements`
  const initialSets: Record<string, number> = useMemo(() => {
    if (existing?.setsDone) return { ...existing.setsDone };
    const seed: Record<string, number> = {};
    if (existing?.movements?.length) {
      for (const name of existing.movements) {
        const target = routine.find((r) => r.name === name)?.targetSets ?? 1;
        seed[name] = target;
      }
    }
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const [setsDone, setSetsDone] = useState<Record<string, number>>(initialSets);
  const [duration, setDuration] = useState(existing?.duration ?? 10);
  const [eb, setEb] = useState(existing?.energyBefore ?? 5);
  const [ea, setEa] = useState(existing?.energyAfter ?? 7);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [newExercise, setNewExercise] = useState("");
  const [newTarget, setNewTarget] = useState(1);

  const totalTarget = routine.reduce((a, r) => a + r.targetSets, 0);
  const totalDone = routine.reduce((a, r) => a + Math.min(setsDone[r.name] ?? 0, r.targetSets), 0);
  const todayPct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;

  const inc = (name: string, target: number) =>
    setSetsDone((s) => ({ ...s, [name]: Math.min(target, (s[name] ?? 0) + 1) }));
  const dec = (name: string) =>
    setSetsDone((s) => ({ ...s, [name]: Math.max(0, (s[name] ?? 0) - 1) }));

  const addExercise = () => {
    const name = newExercise.trim();
    if (!name) return;
    if (routine.some((r) => r.name === name)) {
      toast.error("Already in routine");
      return;
    }
    const target = Math.max(1, newTarget);
    set((s) => ({
      ...s,
      zaryadkaExercises: [...(s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES), { name, targetSets: target, maxReps: 0 }],
    }));
    setNewExercise("");
    setNewTarget(1);
    toast.success("Exercise added");
  };

  const removeExercise = (name: string) => {
    set((s) => ({
      ...s,
      zaryadkaExercises: (s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES).filter((x) => x.name !== name),
    }));
    setSetsDone((s) => {
      const { [name]: _, ...rest } = s;
      return rest;
    });
  };

  const updateTarget = (name: string, target: number) => {
    const v = Math.max(1, target | 0);
    set((s) => ({
      ...s,
      zaryadkaExercises: (s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES).map((x) =>
        x.name === name ? { ...x, targetSets: v } : x,
      ),
    }));
  };

  const updateMax = (name: string, maxReps: number) => {
    const v = Math.max(0, maxReps | 0);
    set((s) => ({
      ...s,
      zaryadkaExercises: (s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES).map((x) =>
        x.name === name ? { ...x, maxReps: v } : x,
      ),
    }));
  };

  const save = (markComplete: boolean) => {
    if (markComplete && totalDone < totalTarget) {
      const remaining = totalTarget - totalDone;
      if (!confirm(`You have ${remaining} set(s) left (${todayPct}%). Mark complete anyway?`)) return;
    }
    const movements = routine.filter((r) => (setsDone[r.name] ?? 0) >= r.targetSets).map((r) => r.name);
    set((s) => {
      const others = s.zaryadka.filter((z) => z.date !== t);
      return {
        ...s,
        zaryadka: [
          ...others,
          {
            id: existing?.id ?? uid(),
            date: t,
            completed: markComplete && totalDone >= totalTarget,
            duration,
            energyBefore: eb,
            energyAfter: ea,
            movements,
            setsDone,
            notes,
          },
        ],
      };
    });
    toast.success(markComplete ? (totalDone >= totalTarget ? "Zaryadka complete." : "Saved as partial") : "Draft saved");
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Morning</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
          <Sunrise className="h-7 w-7 text-primary" /> Zaryadka
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Disciplined morning readiness. Mobility, breath, blood flow.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Today</div>
          <div className="text-2xl font-bold mt-1">{todayPct}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sets</div>
          <div className="text-2xl font-bold mt-1">{totalDone}<span className="text-sm text-muted-foreground">/{totalTarget}</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</div>
          <div className="text-2xl font-bold mt-1">{totalDone >= totalTarget ? "Done" : totalDone > 0 ? "Active" : "Pending"}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold uppercase tracking-wider">Routine</div>
          <div className="h-1.5 flex-1 mx-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${todayPct}%` }} />
          </div>
          <div className="text-xs font-mono text-muted-foreground">{totalDone}/{totalTarget}</div>
        </div>
        <div className="space-y-2">
          {routine.map((r) => {
            const done = setsDone[r.name] ?? 0;
            const isDone = done >= r.targetSets;
            return (
              <div key={r.name} className={`rounded border transition-colors ${isDone ? "bg-primary/10 border-primary" : "border-border"}`}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${isDone ? "font-semibold" : ""}`}>{r.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {Array.from({ length: r.targetSets }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-5 rounded-full ${i < done ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{done}/{r.targetSets} sets</span>
                      <label className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        Target
                        <input
                          type="number"
                          min={1}
                          value={r.targetSets}
                          onChange={(e) => updateTarget(r.name, +e.target.value)}
                          className="w-12 px-1 py-0.5 border border-input rounded text-xs bg-background"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => dec(r.name)} aria-label="Remove set" className="w-8 h-8 grid place-items-center rounded border border-input hover:border-primary/50 disabled:opacity-30" disabled={done <= 0}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <button onClick={() => inc(r.name, r.targetSets)} aria-label="Add set" className="w-8 h-8 grid place-items-center rounded bg-primary text-primary-foreground disabled:opacity-30" disabled={isDone}>
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeExercise(r.name)} aria-label={`Delete ${r.name}`} className="w-8 h-8 grid place-items-center text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExercise(); } }}
            placeholder="Add exercise"
            className="flex-1 px-3 py-2 border border-input rounded text-sm bg-background"
          />
          <input
            type="number"
            min={1}
            value={newTarget}
            onChange={(e) => setNewTarget(+e.target.value)}
            title="Target sets"
            className="w-16 px-2 py-2 border border-input rounded text-sm bg-background"
          />
          <button onClick={addExercise} className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold uppercase tracking-wider flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Duration (min)</label>
          <input type="number" min={1} value={duration} onChange={(e) => setDuration(+e.target.value)} className="w-full px-3 py-2 border border-input rounded text-sm bg-background" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Energy before {eb}/10</label>
          <input type="range" min={1} max={10} value={eb} onChange={(e) => setEb(+e.target.value)} className="w-full mt-2 accent-primary" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Energy after {ea}/10</label>
          <input type="range" min={1} max={10} value={ea} onChange={(e) => setEa(+e.target.value)} className="w-full mt-2 accent-primary" />
        </div>
      </div>

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full px-3 py-2 border border-input rounded text-sm bg-background mb-4" rows={3} />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => save(false)} className="py-2.5 border border-input rounded text-sm font-semibold uppercase tracking-wider">Save Draft</button>
        <button onClick={() => save(true)} className="py-2.5 bg-primary text-primary-foreground rounded text-sm font-semibold uppercase tracking-wider">Mark Complete</button>
      </div>
    </div>
  );
}
