import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, Loader2, KeyRound, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MultiRepoInputProps {
  onCodeFetched: (code: string, label: string) => void;
  isLoading: boolean;
}

export function MultiRepoInput({ onCodeFetched, isLoading }: MultiRepoInputProps) {
  const [repos, setRepos] = useState<string[]>(["", ""]);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
    const cleaned = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
    const ghMatch = cleaned.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s]+)/);
    if (ghMatch) return { owner: ghMatch[1], repo: ghMatch[2] };
    return null;
  };

  const addRepo = () => {
    if (repos.length < 5) setRepos([...repos, ""]);
  };

  const removeRepo = (idx: number) => {
    if (repos.length > 2) setRepos(repos.filter((_, i) => i !== idx));
  };

  const updateRepo = (idx: number, val: string) => {
    setRepos(repos.map((r, i) => (i === idx ? val : r)));
    setError("");
  };

  const handleFetch = async () => {
    setError("");
    const validRepos = repos.filter((r) => r.trim()).map((r) => parseGitHubUrl(r));
    if (validRepos.some((r) => !r)) {
      setError("One or more invalid URLs. Use format: owner/repo");
      return;
    }
    if (validRepos.filter(Boolean).length < 2) {
      setError("Enter at least 2 repository URLs for multi-repo analysis.");
      return;
    }

    setFetching(true);
    const allContent: string[] = [];

    try {
      for (const parsed of validRepos) {
        if (!parsed) continue;
        const { data, error: fnError } = await supabase.functions.invoke("fetch-github", {
          body: { owner: parsed.owner, repo: parsed.repo, ...(token ? { token } : {}) },
        });
        if (fnError) throw fnError;
        if (data?.error) { setError(`Error fetching ${parsed.owner}/${parsed.repo}: ${data.error}`); return; }
        allContent.push(data.content);
      }

      const combined = allContent.join("\n\n---\n\n");
      const label = validRepos.filter(Boolean).map((r) => `${r!.owner}/${r!.repo}`).join(" + ");
      onCodeFetched(combined, label);
    } catch (e: any) {
      setError(e.message || "Failed to fetch repositories");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter 2-5 GitHub repository URLs to analyze how they relate, share patterns, or interact.
      </p>
      {repos.map((repo, idx) => (
        <div key={idx} className="flex gap-2">
          <div className="relative flex-1">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={repo}
              onChange={(e) => updateRepo(idx, e.target.value)}
              placeholder={`Repo ${idx + 1}: owner/repo or https://github.com/...`}
              className="pl-10 bg-card border-border/50"
            />
          </div>
          {repos.length > 2 && (
            <Button variant="ghost" size="icon" onClick={() => removeRepo(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        {repos.length < 5 && (
          <Button variant="ghost" size="sm" onClick={addRepo} className="text-xs text-muted-foreground">
            <Plus className="h-3 w-3 mr-1" /> Add repo
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleFetch}
          disabled={fetching || isLoading || repos.filter((r) => r.trim()).length < 2}
          variant="outline"
          className="border-border/50 hover:border-primary/50"
        >
          {fetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Fetch & Analyze
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setShowToken(!showToken)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <KeyRound className="h-3 w-3" />
        {showToken ? "Hide token" : "Private repos? Add token"}
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
