import { useState } from "react";
import { useStore, todayStr, uid, type DietEntry } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, Plus, Droplet } from "lucide-react";

const QUICK = [
  { food: "Eggs (2)", calories: 140, protein: 12, carbs: 1, fat: 10 },
  { food: "Ground beef 100g", calories: 250, protein: 26, carbs: 0, fat: 17 },
  { food: "Chicken breast 100g", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { food: "Steak 200g", calories: 540, protein: 50, carbs: 0, fat: 38 },
  { food: "Greek yogurt 200g", calories: 130, protein: 20, carbs: 8, fat: 3 },
  { food: "Protein shake", calories: 120, protein: 24, carbs: 3, fat: 1 },
  { food: "Rice 100g cooked", calories: 130, protein: 3, carbs: 28, fat: 0 },
  { food: "Potatoes 200g", calories: 160, protein: 4, carbs: 36, fat: 0 },
  { food: "Fruit (apple)", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { food: "Coffee (black)", calories: 2, protein: 0, carbs: 0, fat: 0 },
  { food: "Energy drink", calories: 110, protein: 0, carbs: 28, fat: 0 },
];

export default function DietLog() {
  const [store, set] = useStore();
  const t = todayStr();
  const [date, setDate] = useState(t);
  const [form, setForm] = useState<Partial<DietEntry>>({ meal: "Meal", food: "", calories: 0, protein: 0, carbs: 0, fat: 0 });

  const entries = store.diet.filter((d) => d.date === date).sort((a, b) => a.id.localeCompare(b.id));
  const totals = entries.reduce(
    (a, b) => ({ calories: a.calories + b.calories, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const water = store.water.find((w) => w.date === date)?.ml ?? 0;

  const add = () => {
    if (!form.food) return toast.error("Enter a food");
    set((s) => ({
      ...s,
      diet: [...s.diet, { id: uid(), date, meal: form.meal || "Meal", food: form.food!, calories: +(form.calories || 0), protein: +(form.protein || 0), carbs: +(form.carbs || 0), fat: +(form.fat || 0), notes: form.notes }],
    }));
    setForm({ meal: form.meal || "Meal", food: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
    toast.success("Added");
  };

  const del = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    set((s) => ({ ...s, diet: s.diet.filter((d) => d.id !== id) }));
  };

  const setWater = (ml: number) => {
    set((s) => {
      const others = s.water.filter((w) => w.date !== date);
      return { ...s, water: [...others, { date, ml: Math.max(0, ml) }] };
    });
  };

  const quick = (q: typeof QUICK[number]) => {
    set((s) => ({ ...s, diet: [...s.diet, { id: uid(), date, meal: form.meal || "Meal", ...q }] }));
    toast.success(`Added ${q.food}`);
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Diet Log</div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Fuel</h1>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-input rounded-md text-sm bg-background" />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          ["Calories", totals.calories],
          ["Protein", totals.protein + "g"],
          ["Carbs", totals.carbs + "g"],
          ["Fat", totals.fat + "g"],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</div>
            <div className="text-xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"><Droplet className="h-4 w-4 text-primary" /> Water</div>
          <div className="text-lg font-bold">{water} ml</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[250, 500, 750].map((n) => (
            <button key={n} onClick={() => setWater(water + n)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-semibold uppercase tracking-wider">+{n} ml</button>
          ))}
          <button onClick={() => setWater(0)} className="px-3 py-1.5 border border-input rounded text-xs font-semibold uppercase tracking-wider">Reset</button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="text-sm font-semibold uppercase tracking-wider mb-3">Add entry</div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-3">
          <input className="px-2 py-2 border border-input rounded text-sm bg-background col-span-2 md:col-span-1" placeholder="Meal" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })} />
          <input className="px-2 py-2 border border-input rounded text-sm bg-background col-span-2" placeholder="Food" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} />
          <input type="number" className="px-2 py-2 border border-input rounded text-sm bg-background" placeholder="kcal" value={form.calories || ""} onChange={(e) => setForm({ ...form, calories: +e.target.value })} />
          <input type="number" className="px-2 py-2 border border-input rounded text-sm bg-background" placeholder="P" value={form.protein || ""} onChange={(e) => setForm({ ...form, protein: +e.target.value })} />
          <input type="number" className="px-2 py-2 border border-input rounded text-sm bg-background" placeholder="C" value={form.carbs || ""} onChange={(e) => setForm({ ...form, carbs: +e.target.value })} />
          <input type="number" className="px-2 py-2 border border-input rounded text-sm bg-background" placeholder="F" value={form.fat || ""} onChange={(e) => setForm({ ...form, fat: +e.target.value })} />
        </div>
        <button onClick={add} className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add
        </button>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Quick add</div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q.food} onClick={() => quick(q)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:opacity-90">
                {q.food}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {entries.length === 0 && <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-border rounded-lg">No entries for this day. Eat. Log. Win.</div>}
        {entries.map((e) => (
          <div key={e.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{e.meal}</div>
              <div className="font-semibold">{e.food}</div>
              <div className="text-xs text-muted-foreground">{e.calories} kcal · P{e.protein} · C{e.carbs} · F{e.fat}</div>
            </div>
            <button onClick={() => del(e.id)} className="p-2 text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
