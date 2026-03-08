import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { CodeInput } from "@/components/CodeInput";
import { AnalysisOutput } from "@/components/AnalysisOutput";
import { ExampleSnippets } from "@/components/ExampleSnippets";
import { GitHubInput } from "@/components/GitHubInput";
import { PRInput } from "@/components/PRInput";
import { MultiRepoInput } from "@/components/MultiRepoInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HistoryPanel } from "@/components/HistoryPanel";
import { FollowUpInput } from "@/components/FollowUpInput";
import { UserMenu } from "@/components/UserMenu";
import { UsageIndicator } from "@/components/UsageIndicator";
import { AnalysisModeSelector, AnalysisMode } from "@/components/AnalysisModeSelector";
import { streamAnalysis } from "@/lib/streaming";
import { addToHistory, generateTitle, HistoryEntry } from "@/lib/history";
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Braces, BarChart3, BookOpen, Puzzle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradeModal } from "@/components/UpgradeModal";

const Index = () => {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");
  const [mode, setMode] = useState<AnalysisMode>("architecture");
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const codeRef = useRef("");
  const questionRef = useRef<string | undefined>();
  const sourceRef = useRef<"paste" | "github" | "file" | "example">("paste");
  const { user } = useAuth();
  const { hasPRReview, hasMultiRepo, hasHistory, hasFollowUp } = useUserPlan();

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
          if (fullOutput.length > 20 && user && hasHistory) {
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
  }, [mode, user, hasHistory]);

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

  const handleMultiRepoFetch = (code: string, _label: string) => {
    sourceRef.current = "github";
    handleAnalyze(code);
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

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    if (!hasPRReview && newMode === "pr_diff") { setUpgradeFeature("PR Review"); return; }
    if (!hasMultiRepo && newMode === "multi_repo") { setUpgradeFeature("Multi-Repo Analysis"); return; }
    if (newMode === "pr_diff") setActiveTab("pr");
    else if (newMode === "multi_repo") setActiveTab("multi");
    else if (activeTab === "pr" || activeTab === "multi") setActiveTab("paste");
  };

  const handleTabChange = (tab: string) => {
    if (!hasPRReview && tab === "pr") { setUpgradeFeature("PR Review"); return; }
    if (!hasMultiRepo && tab === "multi") { setUpgradeFeature("Multi-Repo Analysis"); return; }
    setActiveTab(tab);
  };

  const showExamples = !["pr_diff", "multi_repo"].includes(mode);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Analyze Code" description="Paste code, connect GitHub repos, or submit PRs for instant AI-powered analysis across 13 specialized modes." />
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
            <Link to="/guide" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
              <BookOpen className="h-3.5 w-3.5" /> Guide
            </Link>
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
              <BarChart3 className="h-3.5 w-3.5" /> Stats
            </Link>
            <Link to="/bookmarklet" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
              <Puzzle className="h-3.5 w-3.5" /> Widget
            </Link>
            <UsageIndicator />
            {hasHistory && <HistoryPanel onSelect={handleHistorySelect} />}
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Understand any codebase
            <br />
            <span className="text-primary">in seconds</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            13 AI-powered analysis modes: architecture, security, debugging, documentation,
            test generation, refactoring, PR review, multi-repo understanding, and more.
          </p>
        </div>

        {/* Analysis Mode Selector */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground text-center mb-3">Choose analysis mode</p>
          <AnalysisModeSelector value={mode} onChange={handleModeChange} />
        </div>

        {showExamples && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground text-center mb-2">Try an example</p>
            <ExampleSnippets onSelect={handleExampleSelect} />
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-xl p-6 glow-primary">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 bg-muted/50">
              <TabsTrigger value="paste" className="text-xs">Paste Code</TabsTrigger>
              <TabsTrigger value="github" className="text-xs">GitHub Repo</TabsTrigger>
              <TabsTrigger value="pr" className="text-xs flex items-center gap-1">
                PR Review
                {!hasPRReview && <Lock className="h-3 w-3 text-muted-foreground" />}
              </TabsTrigger>
              <TabsTrigger value="multi" className="text-xs flex items-center gap-1">
                Multi-Repo
                {!hasMultiRepo && <Lock className="h-3 w-3 text-muted-foreground" />}
              </TabsTrigger>
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
            <TabsContent value="multi">
              <MultiRepoInput onCodeFetched={handleMultiRepoFetch} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>

        <UpgradeModal
          open={!!upgradeFeature}
          onOpenChange={(open) => !open && setUpgradeFeature(null)}
          feature={upgradeFeature ?? ""}
        />

        <AnalysisOutput
          content={output}
          isStreaming={isLoading}
          mode={mode}
          shareData={output && !isLoading ? {
            title: generateTitle(codeRef.current, questionRef.current),
            code: codeRef.current,
            question: questionRef.current,
            source: sourceRef.current,
          } : undefined}
        />

        {output && !isLoading && codeRef.current && (
          hasFollowUp ? (
            <FollowUpInput onSubmit={handleFollowUp} isLoading={isLoading} />
          ) : (
            <div
              className="mt-6 p-4 border border-border/50 rounded-xl bg-card text-center cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setUpgradeFeature("Follow-up Questions")}
            >
              <p className="text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Follow-up questions are available on <span className="font-medium text-foreground">Pro</span> and above.{" "}
                <span className="text-primary underline underline-offset-2">Upgrade now</span>
              </p>
            </div>
          )
        )}

        {!output && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14">
            {[
              { title: "Architecture", description: "Patterns, modules, visual diagrams", icon: "🏗️" },
              { title: "Request Flow", description: "Trace data through the system", icon: "🔀" },
              { title: "Security Scan", description: "Vulnerabilities & injection risks", icon: "🛡️" },
              { title: "AI Debugging", description: "Find bugs & edge cases", icon: "🐛" },
              { title: "Test Generation", description: "Auto-generate test suites", icon: "🧪" },
              { title: "Refactoring", description: "AI-powered improvement suggestions", icon: "🔧" },
              { title: "Impact Analysis", description: "Change blast radius mapping", icon: "💥" },
              { title: "Multi-Repo", description: "Cross-repository understanding", icon: "📦" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <span className="text-xl mb-2 block">{feature.icon}</span>
                <h3 className="font-semibold mb-0.5 text-sm">{feature.title}</h3>
                <p className="text-[11px] text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          Powered by AI · Built with Lovable
        </div>
      </footer>
    </div>
  );
};

export default Index;
