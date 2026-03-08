import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import {
  Braces, ArrowLeft, Flame, BarChart3, Code2, Github, FileText, Sparkles,
  Building2, Shield, Zap, CheckCircle, GitPullRequest, Calendar,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalysisRow {
  id: string;
  created_at: string;
  source: string;
  mode: string;
  title: string;
  code: string;
}

const MODE_COLORS: Record<string, string> = {
  architecture: "hsl(250, 80%, 65%)",
  request_flow: "hsl(200, 70%, 55%)",
  security: "hsl(0, 72%, 55%)",
  performance: "hsl(45, 90%, 50%)",
  best_practices: "hsl(170, 70%, 50%)",
  debugging: "hsl(30, 80%, 55%)",
  impact_analysis: "hsl(320, 60%, 55%)",
  test_generation: "hsl(140, 60%, 45%)",
  refactoring: "hsl(180, 50%, 50%)",
  knowledge_graph: "hsl(260, 50%, 60%)",
  multi_repo: "hsl(210, 60%, 55%)",
  pr_diff: "hsl(280, 60%, 60%)",
  documentation: "hsl(90, 60%, 45%)",
};

const MODE_LABELS: Record<string, string> = {
  architecture: "Architecture",
  request_flow: "Request Flow",
  security: "Security",
  performance: "Performance",
  best_practices: "Best Practices",
  debugging: "AI Debug",
  impact_analysis: "Impact",
  test_generation: "Test Gen",
  refactoring: "Refactoring",
  knowledge_graph: "Knowledge",
  multi_repo: "Multi-Repo",
  pr_diff: "PR Review",
  documentation: "Documentation",
};

const MODE_ICONS: Record<string, typeof Building2> = {
  architecture: Building2,
  security: Shield,
  performance: Zap,
  best_practices: CheckCircle,
  pr_diff: GitPullRequest,
};

const SOURCE_ICONS: Record<string, typeof Code2> = {
  paste: Code2,
  github: Github,
  file: FileText,
  example: Sparkles,
};

function detectLanguages(code: string): string[] {
  const langs: string[] = [];
  const indicators: [string, RegExp][] = [
    ["TypeScript", /\b(interface|type\s+\w+\s*=|:\s*(string|number|boolean))\b/],
    ["JavaScript", /\b(const|let|var|function|=>|require\()\b/],
    ["Python", /\b(def |import |from .+ import|class \w+:)\b/],
    ["Rust", /\b(fn |let mut|impl |pub fn|use std::)\b/],
    ["Go", /\b(func |package |import \(|go func)\b/],
    ["Java", /\b(public class|private |void |System\.out)\b/],
    ["SQL", /\b(SELECT|CREATE TABLE|INSERT INTO|ALTER TABLE)\b/i],
    ["HTML", /<(div|span|html|head|body)\b/i],
    ["CSS", /\b(display:|margin:|padding:|flex|grid)\s*:/],
    ["YAML", /^\w+:\s*\n/m],
    ["JSON", /^\s*\{[\s\S]*"[^"]+"\s*:/m],
  ];
  for (const [lang, regex] of indicators) {
    if (regex.test(code)) langs.push(lang);
  }
  return langs.length > 0 ? langs : ["Unknown"];
}

function calculateStreak(dates: string[]): { current: number; best: number } {
  if (dates.length === 0) return { current: 0, best: 0 };

  const uniqueDays = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) current++;
      else break;
    }
  }

  let best = 1;
  let run = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) { run++; best = Math.max(best, run); }
    else run = 1;
  }
  if (uniqueDays.length === 1) best = 1;

  return { current, best };
}

function getLast14DaysActivity(dates: string[]): { day: string; count: number }[] {
  const result: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    const count = dates.filter((dt) => dt.startsWith(key)).length;
    result.push({ day: label, count });
  }
  return result;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analyses")
      .select("id, created_at, source, mode, title, code")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnalyses((data as AnalysisRow[]) || []);
        setLoading(false);
      });
  }, [user]);

  const dates = analyses.map((a) => a.created_at);
  const streak = calculateStreak(dates);
  const activity = getLast14DaysActivity(dates);

  // Mode breakdown
  const modeCounts: Record<string, number> = {};
  for (const a of analyses) {
    modeCounts[a.mode || "architecture"] = (modeCounts[a.mode || "architecture"] || 0) + 1;
  }
  const modeData = Object.entries(modeCounts).map(([name, value]) => ({
    name: MODE_LABELS[name] || name,
    value,
    color: MODE_COLORS[name] || "hsl(220, 15%, 50%)",
  }));

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  for (const a of analyses) {
    sourceCounts[a.source || "paste"] = (sourceCounts[a.source || "paste"] || 0) + 1;
  }

  // Language detection
  const langCounts: Record<string, number> = {};
  for (const a of analyses) {
    for (const lang of detectLanguages(a.code.slice(0, 2000))) {
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
  }
  const topLangs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

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
            </Link>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your Analytics</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No analyses yet</p>
            <p className="text-sm mt-1">Start analyzing code to see your stats here.</p>
            <Link to="/" className="inline-flex items-center gap-1.5 mt-4 text-primary hover:underline text-sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Go analyze some code
            </Link>
          </div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Analyses"
                value={analyses.length}
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <StatCard
                label="Current Streak"
                value={`${streak.current} day${streak.current !== 1 ? "s" : ""}`}
                icon={<Flame className="h-4 w-4 text-orange-500" />}
                sub={`Best: ${streak.best} day${streak.best !== 1 ? "s" : ""}`}
              />
              <StatCard
                label="Modes Used"
                value={Object.keys(modeCounts).length}
                icon={<Building2 className="h-4 w-4" />}
              />
              <StatCard
                label="Languages"
                value={Object.keys(langCounts).length}
                icon={<Code2 className="h-4 w-4" />}
              />
            </div>

            {/* Activity chart */}
            <div className="bg-card border border-border/50 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Activity (Last 14 Days)</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={activity}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={24} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Mode breakdown */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="font-semibold mb-4">Analysis Modes</h2>
                {modeData.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="w-28 h-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={modeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                            {modeData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 min-w-0">
                      {modeData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="truncate text-muted-foreground">{d.name}</span>
                          <span className="font-mono font-medium ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Source breakdown */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="font-semibold mb-4">Input Sources</h2>
                <div className="space-y-3">
                  {Object.entries(sourceCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => {
                      const Icon = SOURCE_ICONS[source] || Code2;
                      const pct = Math.round((count / analyses.length) * 100);
                      return (
                        <div key={source}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="flex items-center gap-2 text-muted-foreground capitalize">
                              <Icon className="h-3.5 w-3.5" /> {source}
                            </span>
                            <span className="font-mono font-medium">{count}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top languages */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h2 className="font-semibold mb-4">Languages Detected</h2>
                <div className="space-y-3">
                  {topLangs.map(([lang, count]) => {
                    const pct = Math.round((count / analyses.length) * 100);
                    return (
                      <div key={lang}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{lang}</span>
                          <span className="font-mono font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
