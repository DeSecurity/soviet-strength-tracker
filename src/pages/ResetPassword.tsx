import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The HashRouter strips Supabase's recovery hash; check session presence as the trigger.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-background text-foreground rounded-lg border border-border p-6 shadow-xl">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Reset password</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter a new password for your account.</p>

        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Open the password reset link from your email to continue.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
