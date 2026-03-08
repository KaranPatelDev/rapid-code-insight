import {
  Shield, Zap, CheckCircle, Building2, GitPullRequest,
  Route, Bug, GitCompare, FlaskConical, Network, Brain, Wrench, Layers, FileText, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type AnalysisMode =
  | "architecture"
  | "request_flow"
  | "security"
  | "performance"
  | "best_practices"
  | "debugging"
  | "impact_analysis"
  | "test_generation"
  | "refactoring"
  | "knowledge_graph"
  | "multi_repo"
  | "pr_diff"
  | "documentation";

interface AnalysisModeSelectorProps {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

const modes: { id: AnalysisMode; label: string; icon: typeof Shield; description: string; category: string }[] = [
  { id: "architecture", label: "Architecture", icon: Building2, description: "Patterns & structure", category: "Understand" },
  { id: "request_flow", label: "Request Flow", icon: Route, description: "Trace data & requests", category: "Understand" },
  { id: "knowledge_graph", label: "Knowledge Graph", icon: Brain, description: "Developer map", category: "Understand" },
  { id: "multi_repo", label: "Multi-Repo", icon: Layers, description: "Cross-repo analysis", category: "Understand" },
  { id: "security", label: "Security Scan", icon: Shield, description: "Vulnerabilities & risks", category: "Analyze" },
  { id: "performance", label: "Performance", icon: Zap, description: "Speed & efficiency", category: "Analyze" },
  { id: "debugging", label: "AI Debug", icon: Bug, description: "Find & fix bugs", category: "Analyze" },
  { id: "impact_analysis", label: "Impact Analysis", icon: GitCompare, description: "Change blast radius", category: "Analyze" },
  { id: "best_practices", label: "Best Practices", icon: CheckCircle, description: "Code quality", category: "Improve" },
  { id: "refactoring", label: "Refactoring", icon: Wrench, description: "AI refactor suggestions", category: "Improve" },
  { id: "test_generation", label: "Test Gen", icon: FlaskConical, description: "Generate test cases", category: "Improve" },
  { id: "documentation", label: "Documentation", icon: FileText, description: "Generate full docs", category: "Improve" },
  { id: "pr_diff", label: "PR Review", icon: GitPullRequest, description: "Diff & review", category: "Review" },
];

const categories = ["Understand", "Analyze", "Improve", "Review"];

export function AnalysisModeSelector({ value, onChange }: AnalysisModeSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleModes = expanded ? modes : modes.slice(0, 6);
  const hasMore = modes.length > 6;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {visibleModes.map((mode) => {
          const Icon = mode.icon;
          const active = value === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
              <span className="text-[11px] font-medium leading-tight">{mode.label}</span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
        >
          {expanded ? "Show less ↑" : `Show all ${modes.length} modes ↓`}
        </button>
      )}
    </div>
  );
}

export const MODE_LABELS: Record<string, string> = Object.fromEntries(modes.map((m) => [m.id, m.label]));
