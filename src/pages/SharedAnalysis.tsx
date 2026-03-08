import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisOutput } from "@/components/AnalysisOutput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Braces, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SharedData {
  title: string;
  code: string;
  question?: string;
  output: string;
  source: string;
  created_at: string;
}

const SharedAnalysis = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shortId) return;
    (async () => {
      const { data: row, error: err } = await supabase
        .from("shared_analyses")
        .select("title, code, question, output, source, created_at")
        .eq("short_id", shortId)
        .maybeSingle();

      if (err || !row) {
        setError("Analysis not found or has been removed.");
      } else {
        setData(row as SharedData);
      }
      setLoading(false);
    })();
  }, [shortId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
                <Braces className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">CodeLens</span>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> New Analysis</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/">Go to CodeLens</Link>
            </Button>
          </div>
        )}
        {data && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{data.title}</h1>
              {data.question && (
                <p className="text-muted-foreground mt-1">Question: {data.question}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Shared on {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
            <AnalysisOutput content={data.output} isStreaming={false} />
          </>
        )}
      </main>
    </div>
  );
};

export default SharedAnalysis;
