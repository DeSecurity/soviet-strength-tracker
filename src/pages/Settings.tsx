import { useAuth } from "@/contexts/AuthContext";
import { saveStore, loadStore } from "@/lib/store";
import { toast } from "sonner";

export default function Settings() {
  const { user, signOut } = useAuth();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(loadStore(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soviet-strength-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string);
        saveStore(data);
        toast.success("Data imported");
      } catch {
        toast.error("Invalid file");
      }
    };
    r.readAsText(f);
  };

  const reset = () => {
    if (!confirm("Erase all locally stored training data? This cannot be undone.")) return;
    saveStore({ diet: [], water: [], pushups: [], maxTests: [], zaryadka: [], zaryadkaExercises: DEFAULT_ZARYADKA_EXERCISES });
    toast.success("Data cleared");
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Account</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Signed in as</div>
        <div className="font-semibold mt-1">{user?.email}</div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
        <div className="text-sm font-semibold uppercase tracking-wider">Data</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-xs font-semibold uppercase tracking-wider">Export JSON</button>
          <label className="px-4 py-2 border border-input rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importData} />
          </label>
          <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-semibold uppercase tracking-wider">Clear All</button>
        </div>
        <p className="text-xs text-muted-foreground">Training data is stored locally in this browser.</p>
      </div>

      <button onClick={async () => { await signOut(); toast.success("Signed out"); }} className="w-full py-3 border border-input rounded text-sm font-semibold uppercase tracking-wider hover:bg-muted">
        Sign Out
      </button>
    </div>
  );
}
