import { Shield, Zap, CheckCircle, Building2, GitPullRequest } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnalysisMode = "architecture" | "security" | "performance" | "best_practices" | "pr_diff";

interface AnalysisModeSelectorProps {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

const modes: { id: AnalysisMode; label: string; icon: typeof Shield; description: string }[] = [
  { id: "architecture", label: "Architecture", icon: Building2, description: "Patterns & structure" },
  { id: "security", label: "Security", icon: Shield, description: "Vulnerabilities & risks" },
  { id: "performance", label: "Performance", icon: Zap, description: "Speed & efficiency" },
  { id: "best_practices", label: "Best Practices", icon: CheckCircle, description: "Code quality" },
  { id: "pr_diff", label: "PR Review", icon: GitPullRequest, description: "Diff & impact analysis" },
];

export function AnalysisModeSelector({ value, onChange }: AnalysisModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all",
              active
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            <span className="text-xs font-medium">{mode.label}</span>
            <span className="text-[10px] opacity-70">{mode.description}</span>
          </button>
        );
      })}
    </div>
  );
}
