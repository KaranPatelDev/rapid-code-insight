import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GitHubInputProps {
  onCodeFetched: (code: string, repoName: string) => void;
  isLoading: boolean;
}

export function GitHubInput({ onCodeFetched, isLoading }: GitHubInputProps) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const normalizeUrl = (input: string): string => {
    let cleaned = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
    // Fix missing protocol
    if (cleaned.startsWith("github.com")) cleaned = "https://" + cleaned;
    // Strip tree/branch paths: github.com/owner/repo/tree/main/... → github.com/owner/repo
    cleaned = cleaned.replace(/(github\.com\/[^\/\s]+\/[^\/\s]+)\/(tree|blob|commits|issues|pulls|actions|wiki|releases|tags|compare|settings)(\/.*)?$/, "$1");
    return cleaned;
  };

  const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
    const cleaned = normalizeUrl(input);
    const fullMatch = cleaned.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/);
    if (fullMatch) return { owner: fullMatch[1], repo: fullMatch[2] };
    const shortMatch = cleaned.match(/^([^\/.\s]+)\/([^\/\s]+)$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };
    return null;
  };

  const handleFetch = async () => {
    setError("");
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      const hint = url.includes("github.com")
        ? `Try: https://github.com/facebook/react`
        : `Try: facebook/react or https://github.com/facebook/react`;
      setError(`Couldn't parse that URL. ${hint}`);
      return;
    }

    setFetching(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-github", {
        body: { owner: parsed.owner, repo: parsed.repo, ...(token ? { token } : {}) },
      });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        return;
      }

      onCodeFetched(data.content, `${parsed.owner}/${parsed.repo}`);
    } catch (e: any) {
      setError(e.message || "Failed to fetch repository");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="owner/repo or https://github.com/owner/repo"
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
          {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
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
