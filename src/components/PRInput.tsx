import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitPullRequest, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PRInputProps {
  onDiffFetched: (diff: string, prTitle: string) => void;
  isLoading: boolean;
}

export function PRInput({ onDiffFetched, isLoading }: PRInputProps) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const parsePRUrl = (input: string): { owner: string; repo: string; pr: string } | null => {
    let cleaned = input.trim();
    if (cleaned.startsWith("github.com")) cleaned = "https://" + cleaned;
    const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (match) return { owner: match[1], repo: match[2], pr: match[3] };
    return null;
  };

  const handleFetch = async () => {
    setError("");
    const parsed = parsePRUrl(url);
    if (!parsed) {
      setError("Couldn't parse that PR URL. Expected format: https://github.com/owner/repo/pull/123");
      return;
    }

    setFetching(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-github", {
        body: {
          owner: parsed.owner,
          repo: parsed.repo,
          pr_number: parseInt(parsed.pr),
          ...(token ? { token } : {}),
        },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        return;
      }

      onDiffFetched(data.content, `PR #${parsed.pr}: ${data.title || "Review"}`);
    } catch (e: any) {
      setError(e.message || "Failed to fetch PR");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter a GitHub Pull Request URL to analyze changes, impact, and potential regressions.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <GitPullRequest className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="https://github.com/owner/repo/pull/123"
            className="pl-10 bg-card border-border/50"
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          />
        </div>
        <Button
          onClick={handleFetch}
          disabled={fetching || isLoading || !url.trim()}
          variant="outline"
          className="border-border/50 hover:border-primary/50"
        >
          {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze PR"}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setShowToken(!showToken)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <KeyRound className="h-3 w-3" />
        {showToken ? "Hide token" : "Private repo? Add token"}
      </button>
      {showToken && (
        <Input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub personal access token (optional)"
          className="bg-card border-border/50 text-sm"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
