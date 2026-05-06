import { useState, useMemo, useEffect, useRef } from "react";
import { useStore, todayStr, uid } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, Plus, Calculator, AlertTriangle, Target } from "lucide-react";

// Effort 1..10 → 30%..80% of current max
const effortToPct = (e: number) => 0.3 + ((e - 1) / 9) * 0.5;

export default function Pushups() {
  const [store, set] = useStore();
  const t = todayStr();

  const currentMax = useMemo(() => {
    if (!store.maxTests.length) return 0;
    const latest = [...store.maxTests].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return latest.reps;
  }, [store.maxTests]);

  const [effort, setEffort] = useState(5);
  const [reps, setReps] = useState(currentMax ? Math.round(currentMax * effortToPct(5)) : 10);
  const [notes, setNotes] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const repsTouched = useRef(false);

  // Auto-update reps when effort or max changes, unless user manually edited reps
  useEffect(() => {
    if (currentMax > 0 && !repsTouched.current) {
      setReps(Math.max(1, Math.round(currentMax * effortToPct(effort))));
    }
  }, [effort, currentMax]);

  const todaySets = store.pushups.filter((p) => p.date === t).sort((a, b) => a.setNumber - b.setNumber);
  const totalReps = todaySets.reduce((a, b) => a + b.reps, 0);
  const best = todaySets.reduce((m, s) => Math.max(m, s.reps), 0);
  const avg = todaySets.length ? Math.round(totalReps / todaySets.length) : 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
  });
  const weekTotal = store.pushups.filter((p) => last7.includes(p.date)).reduce((a, b) => a + b.reps, 0);

  const addSet = () => {
    if (reps <= 0) return;
    set((s) => ({
      ...s,
      pushups: [...s.pushups, { id: uid(), date: t, setNumber: todaySets.length + 1, reps, effort, notes }],
    }));
    setNotes("");
    repsTouched.current = false;
    toast.success(`Set ${todaySets.length + 1}: ${reps} reps`);
  };

  const del = (id: string) => {
    if (!confirm("Delete set?")) return;
    set((s) => ({ ...s, pushups: s.pushups.filter((p) => p.id !== id) }));
  };

  const setMax = () => {
    const n = parseInt(maxInput, 10);
    if (!n || n <= 0) return;
    set((s) => ({ ...s, maxTests: [...s.maxTests, { id: uid(), date: t, reps: n }] }));
    setMaxInput("");
    repsTouched.current = false;
    toast.success(`Current max set to ${n}`);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Push-Up GTG</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Grease the Groove</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Frequent submaximal sets. Stay at 40–60% of your max. Clean form. Never to failure.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[["Total", totalReps], ["Sets", todaySets.length], ["Best", best], ["Avg", avg]].map(([l, v]) => (
          <div key={l as string} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</div>
            <div className="text-xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold uppercase tracking-wider mb-3">Log a set</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Reps</label>
            <input type="number" min={1} value={reps} onChange={(e) => { repsTouched.current = true; setReps(+e.target.value); }} className="w-full px-3 py-2 border border-input rounded text-sm bg-background" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Effort {effort}/10 {currentMax > 0 && <span className="text-muted-foreground/70">· {Math.round(effortToPct(effort) * 100)}% of {currentMax}</span>}
            </label>
            <input type="range" min={1} max={10} value={effort} onChange={(e) => { repsTouched.current = false; setEffort(+e.target.value); }} className="w-full mt-2.5 accent-primary" />
          </div>
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 border border-input rounded text-sm bg-background mb-3" />
        <button onClick={addSet} className="w-full py-2.5 bg-primary text-primary-foreground rounded text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Set
        </button>
        {effort >= 9 && (
          <div className="mt-3 flex items-start gap-2 text-xs text-primary">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>That's near failure. GTG works best at moderate effort. Drop the reps.</span>
          </div>
        )}
      </div>

      <div className="bg-secondary text-secondary-foreground rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-3">
          <Target className="h-4 w-4 text-primary" /> Current Max
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Saved max</div>
            <div className="text-3xl font-bold text-primary">{currentMax || "—"}</div>
          </div>
          <input type="number" placeholder="New max" value={maxInput} onChange={(e) => setMaxInput(e.target.value)} className="w-28 px-3 py-2 border border-white/20 bg-black/20 rounded text-sm" />
          <button onClick={setMax} className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-semibold uppercase tracking-wider">Set Max</button>
        </div>
        {currentMax > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/80 col-span-3 mb-1">
              <Calculator className="h-3 w-3" /> GTG zones
            </div>
            {[0.4, 0.5, 0.6].map((p) => (
              <div key={p} className="bg-black/20 rounded p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">{p * 100}%</div>
                <div className="text-lg font-bold text-primary">{Math.round(currentMax * p)}</div>
                <div className="text-[10px] text-muted-foreground/80">reps/set</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-3">Set your current max so the effort slider auto-suggests reps. Re-test every 2–4 weeks.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Week Total</div>
          <div className="text-2xl font-bold mt-1">{weekTotal}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Best Max</div>
          <div className="text-2xl font-bold mt-1">{store.maxTests.reduce((m, t) => Math.max(m, t.reps), 0)}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Today's Sets</div>
        {todaySets.length === 0 && <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">No sets yet. Drop and give twenty.</div>}
        {todaySets.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{s.setNumber}</div>
            <div className="flex-1">
              <div className="font-semibold">{s.reps} reps · effort {s.effort}/10</div>
              {s.notes && <div className="text-xs text-muted-foreground">{s.notes}</div>}
            </div>
            <button onClick={() => del(s.id)} className="p-2 text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
