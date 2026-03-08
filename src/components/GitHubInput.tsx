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

  const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
    // Handle: https://github.com/owner/repo, github.com/owner/repo, owner/repo
    const cleaned = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
    const ghMatch = cleaned.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s]+)/);
    if (ghMatch) return { owner: ghMatch[1], repo: ghMatch[2] };
    return null;
  };

  const handleFetch = async () => {
    setError("");
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("Invalid GitHub URL. Use format: owner/repo or https://github.com/owner/repo");
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
