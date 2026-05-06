import { useState, useMemo } from "react";
import { useStore, todayStr, uid, DEFAULT_ZARYADKA_EXERCISES } from "@/lib/store";
import { toast } from "sonner";
import { Check, Sunrise, Plus, X } from "lucide-react";

export default function Zaryadka() {
  const [store, set] = useStore();
  const t = todayStr();
  const existing = store.zaryadka.find((z) => z.date === t);

  const [movements, setMovements] = useState<string[]>(existing?.movements ?? []);
  const [duration, setDuration] = useState(existing?.duration ?? 10);
  const [eb, setEb] = useState(existing?.energyBefore ?? 5);
  const [ea, setEa] = useState(existing?.energyAfter ?? 7);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [newExercise, setNewExercise] = useState("");

  const routine = store.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES;

  const toggle = (m: string) =>
    setMovements((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const addExercise = () => {
    const name = newExercise.trim();
    if (!name) return;
    if (routine.includes(name)) {
      toast.error("Already in routine");
      return;
    }
    set((s) => ({ ...s, zaryadkaExercises: [...(s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES), name] }));
    setNewExercise("");
    toast.success("Exercise added");
  };

  const removeExercise = (m: string) => {
    set((s) => ({
      ...s,
      zaryadkaExercises: (s.zaryadkaExercises ?? DEFAULT_ZARYADKA_EXERCISES).filter((x) => x !== m),
    }));
    setMovements((prev) => prev.filter((x) => x !== m));
  };

  const completionRate = useMemo(() => {
    const total = store.zaryadka.length;
    const done = store.zaryadka.filter((z) => z.completed).length;
    return total ? Math.round((done / total) * 100) : 0;
  }, [store.zaryadka]);

  const save = (completed: boolean) => {
    set((s) => {
      const others = s.zaryadka.filter((z) => z.date !== t);
      return {
        ...s,
        zaryadka: [
          ...others,
          { id: existing?.id ?? uid(), date: t, completed, duration, energyBefore: eb, energyAfter: ea, movements, notes },
        ],
      };
    });
    toast.success(completed ? "Zaryadka complete." : "Saved");
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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Today</div>
          <div className="text-2xl font-bold mt-1">{existing?.completed ? "Done" : "Pending"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Completion</div>
          <div className="text-2xl font-bold mt-1">{completionRate}%</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold uppercase tracking-wider mb-3">Routine</div>
        <div className="space-y-1.5">
          {routine.map((m) => {
            const done = movements.includes(m);
            return (
              <div key={m} className={`flex items-center gap-2 rounded border transition-colors ${done ? "bg-primary/10 border-primary" : "border-border"}`}>
                <button onClick={() => toggle(m)} className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-left">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${done ? "bg-primary border-primary" : "border-input"}`}>
                    {done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                  </div>
                  <span className={done ? "font-semibold" : ""}>{m}</span>
                </button>
                <button onClick={() => removeExercise(m)} aria-label={`Remove ${m}`} className="px-3 py-2.5 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
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
