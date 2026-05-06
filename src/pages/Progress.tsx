import { useStore, streak } from "@/lib/store";

export default function Progress() {
  const [store] = useStore();

  const dietStreak = streak([...new Set(store.diet.map((d) => d.date))]);
  const pushupStreak = streak([...new Set(store.pushups.map((p) => p.date))]);
  const zStreak = streak(store.zaryadka.filter((z) => z.completed).map((z) => z.date));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10);
  });

  const weeklyPushups = last7.map((d) => ({
    date: d.slice(5),
    reps: store.pushups.filter((p) => p.date === d).reduce((a, b) => a + b.reps, 0),
  }));
  const maxBar = Math.max(1, ...weeklyPushups.map((w) => w.reps));

  const totalPushups = store.pushups.reduce((a, b) => a + b.reps, 0);
  const bestMax = store.maxTests.reduce((m, t) => Math.max(m, t.reps), 0);
  const completionRate = store.zaryadka.length
    ? Math.round((store.zaryadka.filter((z) => z.completed).length / store.zaryadka.length) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progress</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">The Record</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[["Diet", dietStreak], ["Push-Ups", pushupStreak], ["Zaryadka", zStreak]].map(([l, v]) => (
          <div key={l as string} className="bg-secondary text-secondary-foreground rounded-lg p-4 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">{l} streak</div>
            <div className="text-3xl font-bold text-primary mt-1">{v}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">days</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold uppercase tracking-wider mb-4">Weekly Push-Up Volume</div>
        <div className="flex items-end gap-2 h-40">
          {weeklyPushups.map((w) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] font-bold">{w.reps || ""}</div>
              <div className="w-full bg-primary rounded-t" style={{ height: `${(w.reps / maxBar) * 100}%`, minHeight: w.reps ? 4 : 0 }} />
              <div className="text-[10px] text-muted-foreground">{w.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Push-Ups</div>
          <div className="text-3xl font-bold mt-1">{totalPushups}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Best Max Test</div>
          <div className="text-3xl font-bold mt-1">{bestMax}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Zaryadka Completion</div>
          <div className="text-3xl font-bold mt-1">{completionRate}%</div>
        </div>
      </div>
    </div>
  );
}
