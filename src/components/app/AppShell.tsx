import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Dumbbell, Sunrise, TrendingUp, Settings as SettingsIcon, LogOut, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/diet", label: "Diet", icon: UtensilsCrossed },
  { to: "/pushups", label: "Push-Ups", icon: Dumbbell },
  { to: "/zaryadka", label: "Zaryadka", icon: Sunrise },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-secondary text-secondary-foreground border-r border-border">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" strokeWidth={2.5} />
            <div>
              <div className="font-bold tracking-tight text-lg leading-none">SOVIET</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground/80">Strength</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-secondary-foreground/80 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-muted-foreground/70 truncate">{user?.email}</div>
          <button
            onClick={async () => { await signOut(); toast.success("Signed out"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-secondary-foreground/80 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-secondary text-secondary-foreground border-b border-white/10">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" strokeWidth={2.5} />
          <span className="font-bold tracking-tight">SOVIET STRENGTH</span>
        </div>
        <button onClick={async () => { await signOut(); toast.success("Signed out"); }} className="text-xs uppercase tracking-wider text-muted-foreground/80">
          Sign out
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-secondary text-secondary-foreground border-t border-white/10 grid grid-cols-6 z-40">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? "text-primary" : "text-secondary-foreground/70"
              }`
            }
          >
            <l.icon className="h-4 w-4" />
            <span className="truncate">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
