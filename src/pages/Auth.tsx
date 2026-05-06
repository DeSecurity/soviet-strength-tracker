import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Star } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirect = window.location.origin + window.location.pathname + "#/";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!remember) {
          // Move tokens from localStorage -> sessionStorage so they don't survive browser close
          const k = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
          if (k) {
            const v = localStorage.getItem(k);
            if (v) sessionStorage.setItem(k, v);
            localStorage.removeItem(k);
          }
        }
        toast.success("Welcome back, comrade.");
      } else {
        const redirect = window.location.origin + window.location.pathname + "#/reset-password";
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + window.location.pathname,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Star className="h-7 w-7 text-primary" strokeWidth={2.5} />
            <div className="text-left">
              <div className="font-bold tracking-tight text-xl leading-none">SOVIET STRENGTH</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">Discipline · Diet · Drill</div>
            </div>
          </div>
        </div>

        <div className="bg-background text-foreground rounded-lg border border-border p-6 shadow-xl">
          <div className="flex border-b border-border mb-6">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 pb-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  mode === m ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "forgot" && (
            <div className="mb-4 text-sm font-semibold uppercase tracking-wider">Reset password</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" onClick={() => setMode("forgot")} className="text-primary font-medium hover:underline">
                  Forgot?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "..." : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px bg-border flex-1" /> OR <div className="h-px bg-border flex-1" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full py-2.5 border border-input rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Continue with Google
              </button>
            </>
          )}

          {mode === "forgot" && (
            <button type="button" onClick={() => setMode("signin")} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/70 mt-6">
          Diet · Push-Ups · Zaryadka
        </p>
      </div>
    </div>
  );
}
