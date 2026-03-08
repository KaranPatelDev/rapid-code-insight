import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { CodeInput } from "@/components/CodeInput";
import { AnalysisOutput } from "@/components/AnalysisOutput";
import { ExampleSnippets } from "@/components/ExampleSnippets";
import { GitHubInput } from "@/components/GitHubInput";
import { PRInput } from "@/components/PRInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HistoryPanel } from "@/components/HistoryPanel";
import { FollowUpInput } from "@/components/FollowUpInput";
import { UserMenu } from "@/components/UserMenu";
import { AnalysisModeSelector, AnalysisMode } from "@/components/AnalysisModeSelector";
import { streamAnalysis } from "@/lib/streaming";
import { addToHistory, generateTitle, HistoryEntry } from "@/lib/history";
import { useAuth } from "@/hooks/useAuth";
import { Braces } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");
  const [mode, setMode] = useState<AnalysisMode>("architecture");
  const codeRef = useRef("");
  const questionRef = useRef<string | undefined>();
  const sourceRef = useRef<"paste" | "github" | "file" | "example">("paste");
  const { user } = useAuth();

  const handleAnalyze = useCallback(async (code: string, question?: string) => {
    setOutput("");
    setIsLoading(true);
    codeRef.current = code;
    questionRef.current = question;

    let fullOutput = "";

    try {
      await streamAnalysis({
        code,
        question,
        mode,
        onDelta: (text) => {
          fullOutput += text;
          setOutput((prev) => prev + text);
        },
        onDone: () => {
          setIsLoading(false);
          if (fullOutput.length > 20 && user) {
            addToHistory(
              {
                title: generateTitle(codeRef.current, questionRef.current),
                code: codeRef.current,
                question: questionRef.current,
                output: fullOutput,
                source: sourceRef.current,
                mode,
              },
              user.id
            );
          }
        },
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        },
      });
    } catch (e) {
      toast.error("Failed to connect to analysis service.");
      setIsLoading(false);
    }
  }, [mode, user]);

  const handleExampleSelect = (code: string) => {
    sourceRef.current = "example";
    setActiveTab("paste");
    handleAnalyze(code);
  };

  const handleGitHubFetch = (code: string, _repoName: string) => {
    sourceRef.current = "github";
    handleAnalyze(code);
  };

  const handlePRFetch = (diff: string, _prTitle: string) => {
    sourceRef.current = "github";
    handleAnalyze(diff);
  };

  const handlePasteSubmit = (code: string, question?: string) => {
    sourceRef.current = "paste";
    handleAnalyze(code, question);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    codeRef.current = entry.code;
    questionRef.current = entry.question;
    sourceRef.current = entry.source;
    if (entry.mode) setMode(entry.mode as AnalysisMode);
    setOutput(entry.output);
  };

  const handleFollowUp = (question: string) => {
    if (!codeRef.current) {
      toast.error("No code context. Analyze some code first.");
      return;
    }
    questionRef.current = question;
    handleAnalyze(codeRef.current, question);
  };

  // Auto-switch to PR tab when PR mode selected
  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    if (newMode === "pr_diff" && activeTab !== "pr") {
      setActiveTab("pr");
    } else if (newMode !== "pr_diff" && activeTab === "pr") {
      setActiveTab("paste");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Braces className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI</span>
          </div>
          <div className="flex items-center gap-1">
            <HistoryPanel onSelect={handleHistorySelect} />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Understand any codebase
            <br />
            <span className="text-primary">in seconds</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Paste your code, fetch from GitHub, review PRs, or upload files. Get instant AI-powered
            architecture analysis, security audits, performance reviews, and more.
          </p>
        </div>

        {/* Analysis Mode Selector */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground text-center mb-3">Choose analysis mode</p>
          <AnalysisModeSelector value={mode} onChange={handleModeChange} />
        </div>

        {mode !== "pr_diff" && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground text-center mb-2">Try an example</p>
            <ExampleSnippets onSelect={handleExampleSelect} />
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-xl p-6 glow-primary">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-muted/50">
              <TabsTrigger value="paste" className="text-xs">Paste Code</TabsTrigger>
              <TabsTrigger value="github" className="text-xs">GitHub Repo</TabsTrigger>
              <TabsTrigger value="pr" className="text-xs">PR Review</TabsTrigger>
            </TabsList>
            <TabsContent value="paste">
              <CodeInput onSubmit={handlePasteSubmit} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="github">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter a public or private GitHub repository URL to fetch and analyze its code.
                </p>
                <GitHubInput onCodeFetched={handleGitHubFetch} isLoading={isLoading} />
              </div>
            </TabsContent>
            <TabsContent value="pr">
              <PRInput onDiffFetched={handlePRFetch} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>

        <AnalysisOutput
          content={output}
          isStreaming={isLoading}
          shareData={output && !isLoading ? {
            title: generateTitle(codeRef.current, questionRef.current),
            code: codeRef.current,
            question: questionRef.current,
            source: sourceRef.current,
          } : undefined}
        />

        {output && !isLoading && codeRef.current && (
          <FollowUpInput onSubmit={handleFollowUp} isLoading={isLoading} />
        )}

        {!output && !isLoading && (
          <div className="grid md:grid-cols-4 gap-4 mt-16">
            {[
              {
                title: "Architecture Analysis",
                description: "Patterns, modules, and system design with visual diagrams.",
                icon: "🏗️",
              },
              {
                title: "Security Audit",
                description: "Vulnerabilities, hardcoded secrets, and injection risks.",
                icon: "🛡️",
              },
              {
                title: "Performance Review",
                description: "N+1 queries, memory leaks, and bottlenecks.",
                icon: "⚡",
              },
              {
                title: "PR Review",
                description: "Diff analysis, impact assessment, and regression detection.",
                icon: "🔀",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <span className="text-2xl mb-3 block">{feature.icon}</span>
                <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-20">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          Powered by AI · Built with Lovable
        </div>
      </footer>
    </div>
  );
};

export default Index;
