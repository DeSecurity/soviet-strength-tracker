import { Link } from "react-router-dom";
import { useStore, todayStr, streak } from "@/lib/store";
import { Flame, UtensilsCrossed, Dumbbell, Sunrise, Droplet, Trophy } from "lucide-react";

function PageHeader() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{today}</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">Today's Drill</h1>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, accent }: any) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [store] = useStore();
  const t = todayStr();

  const todayDiet = store.diet.filter((d) => d.date === t);
  const cals = todayDiet.reduce((a, b) => a + b.calories, 0);
  const protein = todayDiet.reduce((a, b) => a + b.protein, 0);
  const carbs = todayDiet.reduce((a, b) => a + b.carbs, 0);
  const fat = todayDiet.reduce((a, b) => a + b.fat, 0);
  const water = store.water.find((w) => w.date === t)?.ml ?? 0;

  const todayPushups = store.pushups.filter((p) => p.date === t);
  const totalReps = todayPushups.reduce((a, b) => a + b.reps, 0);
  const sets = todayPushups.length;

  const todayZ = store.zaryadka.find((z) => z.date === t);

  const dietStreak = streak([...new Set(store.diet.map((d) => d.date))]);
  const pushupStreak = streak([...new Set(store.pushups.map((p) => p.date))]);
  const zStreak = streak(store.zaryadka.filter((z) => z.completed).map((z) => z.date));

  // Last 7 days totals
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const weekPushups = store.pushups.filter((p) => last7.includes(p.date)).reduce((a, b) => a + b.reps, 0);

  return (
    <div>
      <PageHeader />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Calories" value={cals} sub={`P${protein|0} · C${carbs|0} · F${fat|0}`} icon={Flame} accent />
        <Stat label="Push-Ups" value={totalReps} sub={`${sets} sets`} icon={Dumbbell} accent />
        <Stat label="Water" value={`${water} ml`} icon={Droplet} />
        <Stat label="Zaryadka" value={todayZ?.completed ? "Done" : "Pending"} icon={Sunrise} accent={todayZ?.completed} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-secondary text-secondary-foreground rounded-lg p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground/80 mb-2">
            <Trophy className="h-4 w-4" /> Streaks
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl font-bold text-primary">{dietStreak}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Diet</div></div>
            <div><div className="text-2xl font-bold text-primary">{pushupStreak}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Push-Ups</div></div>
            <div><div className="text-2xl font-bold text-primary">{zStreak}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">Zaryadka</div></div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Weekly Push-Ups</div>
          <div className="text-3xl font-bold">{weekPushups}</div>
          <div className="text-xs text-muted-foreground mt-1">last 7 days</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Best Max Test</div>
          <div className="text-3xl font-bold">{store.maxTests.reduce((m, t) => Math.max(m, t.reps), 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">reps</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link to="/diet" className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
          <UtensilsCrossed className="h-5 w-5 text-primary mb-2" />
          <div className="font-semibold">Log a meal</div>
          <div className="text-xs text-muted-foreground">Quick diet entry</div>
        </Link>
        <Link to="/pushups" className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
          <Dumbbell className="h-5 w-5 text-primary mb-2" />
          <div className="font-semibold">Log a set</div>
          <div className="text-xs text-muted-foreground">Grease the groove</div>
        </Link>
        <Link to="/zaryadka" className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors">
          <Sunrise className="h-5 w-5 text-primary mb-2" />
          <div className="font-semibold">Morning Zaryadka</div>
          <div className="text-xs text-muted-foreground">Daily readiness</div>
        </Link>
      </div>
    </div>
  );
}
