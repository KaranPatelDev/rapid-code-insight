import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Braces, ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Braces className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold mb-3">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
              </p>
              <Button variant="outline" className="mt-6" asChild>
                <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-xl p-8 glow-primary">
              <h1 className="text-2xl font-bold text-center mb-1">Reset password</h1>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Enter your email to receive a reset link
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Email address"
                  required
                  className="bg-background border-border/50"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full glow-primary bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-6">
                <Link to="/auth" className="text-primary hover:underline font-medium">Back to sign in</Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
