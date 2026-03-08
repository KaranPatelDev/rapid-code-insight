import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Braces, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName || undefined);
      if (error) {
        setError(error);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
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
          {signUpSuccess ? (
            <div className="bg-card border border-border/50 rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold mb-3">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                We've sent a verification link to <strong className="text-foreground">{email}</strong>.
                Click the link to activate your account.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => { setIsSignUp(false); setSignUpSuccess(false); }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-xl p-8 glow-primary">
              <h1 className="text-2xl font-bold text-center mb-1">
                {isSignUp ? "Create account" : "Welcome back"}
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-6">
                {isSignUp ? "Sign up to start analyzing code" : "Sign in to continue"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="bg-background border-border/50"
                  />
                )}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="Email address"
                  required
                  className="bg-background border-border/50"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="bg-background border-border/50"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full glow-primary bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUp ? "Sign up" : "Sign in"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
              {!isSignUp && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
