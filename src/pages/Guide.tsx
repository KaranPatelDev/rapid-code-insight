import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import {
  Braces, ArrowLeft, BookOpen, Clipboard, Github, GitPullRequest, Layers,
  Shield, Zap, Bug, Building2, Route, Brain, Wrench, FlaskConical, GitCompare,
  CheckCircle, FileText, BarChart3, History, Share2, Moon, Sun, Download,
  MessageSquare, Search, KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "analysis-modes", label: "Analysis Modes" },
  { id: "input-methods", label: "Input Methods" },
  { id: "github-repos", label: "GitHub Repositories" },
  { id: "pr-review", label: "PR Review" },
  { id: "multi-repo", label: "Multi-Repo Analysis" },
  { id: "documentation-mode", label: "Documentation Generation" },
  { id: "follow-up", label: "Follow-Up Questions" },
  { id: "history", label: "Analysis History" },
  { id: "sharing", label: "Sharing Analyses" },
  { id: "dashboard", label: "Usage Dashboard" },
  { id: "export", label: "Exporting Results" },
  { id: "themes", label: "Themes & Settings" },
  { id: "tips", label: "Tips & Best Practices" },
  { id: "faq", label: "FAQ" },
];

function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}

function SectionNav() {
  const activeId = useActiveSection(sections.map((s) => s.id));

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  return (
    <nav className="hidden lg:block sticky top-20 w-56 shrink-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
      <ul className="space-y-0.5 border-l border-border/50">
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={cn(
                  "block pl-4 py-1.5 text-sm transition-all duration-200 -ml-px border-l-2",
                  isActive
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors">
      <Icon className="h-5 w-5 text-primary mb-3" />
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <span className="text-sm font-bold text-primary">{number}</span>
      </div>
      <div className="pt-1 min-w-0">
        <h4 className="font-semibold mb-1">{title}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-muted border border-border/50 text-muted-foreground">
      {children}
    </kbd>
  );
}

export default function Guide() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
                <Braces className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            </Link>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Guide</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to app
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 flex gap-10">
        <SectionNav />

        <article className="flex-1 min-w-0 max-w-3xl">
          {/* Hero */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">User Guide</h1>
                <p className="text-muted-foreground text-sm">Everything you need to know about CodeLens AI</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              CodeLens AI is an AI-powered code analysis platform with <strong className="text-foreground">13 specialized analysis modes</strong>.
              Paste code, connect GitHub repositories, or submit Pull Request URLs — and instantly receive deep insights
              including architecture diagrams, security audits, AI debugging, test generation, and production-grade documentation.
            </p>
          </div>

          {/* Getting Started */}
          <section id="getting-started" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Getting Started
            </h2>
            <Step number={1} title="Create an account">
              Sign up with your email or use <strong className="text-foreground">Google OAuth</strong> for one-click sign in.
              After email sign up, check your inbox for a verification link.
            </Step>
            <Step number={2} title="Choose an analysis mode">
              Select from 13 modes organized into four categories: <strong className="text-foreground">Understand</strong>,{" "}
              <strong className="text-foreground">Analyze</strong>, <strong className="text-foreground">Improve</strong>, and{" "}
              <strong className="text-foreground">Review</strong>. Click "Show all" to see every mode.
            </Step>
            <Step number={3} title="Input your code">
              Use any of four input methods: paste code directly, enter a GitHub repo URL,
              submit a Pull Request URL, or enter multiple repos for cross-repo analysis.
            </Step>
            <Step number={4} title="Get AI analysis">
              The AI streams its analysis in real-time with rich markdown, Mermaid diagrams,
              syntax-highlighted code blocks, and actionable recommendations.
            </Step>
          </section>

          {/* Analysis Modes */}
          <section id="analysis-modes" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className="text-primary">#</span> Analysis Modes
            </h2>
            <p className="text-muted-foreground mb-6">
              13 specialized modes, each with a purpose-built AI prompt for deep, targeted analysis.
            </p>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Understand</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <FeatureCard icon={Building2} title="Architecture" description="Visualize patterns, modules, component relationships, and dependency graphs with Mermaid diagrams." />
              <FeatureCard icon={Route} title="Request Flow" description="Trace how data and requests flow through your system with sequence diagrams for every major path." />
              <FeatureCard icon={Brain} title="Knowledge Graph" description="Build a developer knowledge map with entity relationships, domain glossary, and onboarding guide." />
              <FeatureCard icon={Layers} title="Multi-Repo" description="Analyze 2–5 repositories together to understand how they interact as a unified system." />
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analyze</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <FeatureCard icon={Shield} title="Security Scan" description="Full security audit covering injection risks, auth vulnerabilities, secrets exposure, and CSRF/CORS issues." />
              <FeatureCard icon={Zap} title="Performance" description="Identify bottlenecks: N+1 queries, memory leaks, unnecessary re-renders, and bundle size issues." />
              <FeatureCard icon={Bug} title="AI Debug" description="Find bugs, race conditions, edge cases, silent failures, and state inconsistencies automatically." />
              <FeatureCard icon={GitCompare} title="Impact Analysis" description="Map the blast radius of changes with dependency graphs, risk heatmaps, and test coverage gaps." />
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Improve</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <FeatureCard icon={CheckCircle} title="Best Practices" description="Code quality scoring with suggestions for organization, type safety, error handling, and accessibility." />
              <FeatureCard icon={Wrench} title="Refactoring" description="AI-powered refactor suggestions with before/after code, design pattern recommendations, and migration paths." />
              <FeatureCard icon={FlaskConical} title="Test Generation" description="Generate comprehensive unit, integration, and component tests with proper setup, mocks, and edge cases." />
              <FeatureCard icon={FileText} title="Documentation" description="Generate production-grade markdown docs with architecture diagrams, API reference, setup instructions, and more." />
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Review</h3>
            <div className="grid sm:grid-cols-1 gap-3 mb-6">
              <FeatureCard icon={GitPullRequest} title="PR Review" description="Analyze Pull Request diffs with severity-rated findings, regression detection, architecture impact, and a final verdict." />
            </div>
          </section>

          {/* Input Methods */}
          <section id="input-methods" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Input Methods
            </h2>
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 font-semibold">Method</th>
                    <th className="text-left p-4 font-semibold">Best For</th>
                    <th className="text-left p-4 font-semibold hidden sm:table-cell">How</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="p-4 flex items-center gap-2"><Clipboard className="h-4 w-4 text-primary" /> Paste Code</td>
                    <td className="p-4 text-muted-foreground">Quick snippets, single files</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">Paste directly into the text area</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="p-4 flex items-center gap-2"><Github className="h-4 w-4 text-primary" /> GitHub Repo</td>
                    <td className="p-4 text-muted-foreground">Full project analysis</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">Enter <code className="bg-muted px-1 rounded text-xs">owner/repo</code> or full URL</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="p-4 flex items-center gap-2"><GitPullRequest className="h-4 w-4 text-primary" /> PR Review</td>
                    <td className="p-4 text-muted-foreground">Code review, regressions</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">Enter PR URL with <code className="bg-muted px-1 rounded text-xs">/pull/123</code></td>
                  </tr>
                  <tr>
                    <td className="p-4 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Multi-Repo</td>
                    <td className="p-4 text-muted-foreground">System-level architecture</td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">Enter 2–5 repository URLs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* GitHub Repos */}
          <section id="github-repos" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> GitHub Repositories
            </h2>
            <p className="text-muted-foreground mb-4">
              CodeLens fetches up to 40 source files (60KB max) from any public GitHub repository. The URL parser
              is smart — it handles multiple formats and auto-corrects common mistakes.
            </p>
            <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3 mb-4">
              <p className="text-sm font-semibold">Accepted URL formats:</p>
              <div className="space-y-1.5">
                {[
                  { input: "facebook/react", note: "Shorthand" },
                  { input: "https://github.com/facebook/react", note: "Full URL" },
                  { input: "github.com/facebook/react", note: "Auto-adds https://" },
                  { input: "https://github.com/facebook/react/tree/main/src", note: "Extra paths stripped" },
                  { input: "https://github.com/facebook/react.git", note: ".git suffix removed" },
                ].map((ex) => (
                  <div key={ex.input} className="flex items-center gap-3 text-sm">
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono flex-shrink-0">{ex.input}</code>
                    <span className="text-muted-foreground text-xs">→ {ex.note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <KeyRound className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Private repositories:</strong> Click "Private repo? Add token" and paste
                a <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Personal Access Token</a> with{" "}
                <code className="bg-muted px-1 rounded text-xs">repo</code> scope. Your token is never stored — it's used only for that single request.
              </div>
            </div>
          </section>

          {/* PR Review */}
          <section id="pr-review" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Pull Request Review
            </h2>
            <p className="text-muted-foreground mb-4">
              Submit any GitHub Pull Request URL to get a comprehensive code review. The AI analyzes the full diff,
              changed files, PR description, and provides:
            </p>
            <ul className="space-y-2 mb-4">
              {[
                "Summary of what the PR does",
                "Impact analysis — what systems are affected",
                "Code review findings rated by severity (Critical → Nit)",
                "Potential regressions and edge cases",
                "Architecture impact with diagrams",
                "Final verdict: APPROVE, REQUEST CHANGES, or COMMENT",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Selecting the "PR Review" mode auto-switches you to the PR tab.
            </p>
          </section>

          {/* Multi-Repo */}
          <section id="multi-repo" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Multi-Repo Analysis
            </h2>
            <p className="text-muted-foreground mb-4">
              Analyze how 2–5 repositories work together as a unified system. The AI identifies shared patterns,
              API contracts, communication methods, and inconsistencies across repos.
            </p>
            <Step number={1} title="Enter repository URLs">
              Add 2–5 GitHub repository URLs. Each one shows a green ✓ when parsed successfully.
            </Step>
            <Step number={2} title="Fetch & Analyze">
              CodeLens fetches code from all repos, combines it, and sends it to the AI with the multi-repo system prompt.
            </Step>
            <Step number={3} title="Review system-level insights">
              Get architecture diagrams, inter-repo dependencies, communication patterns, and deployment ordering.
            </Step>
          </section>

          {/* Documentation Mode */}
          <section id="documentation-mode" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Documentation Generation
            </h2>
            <p className="text-muted-foreground mb-4">
              The <strong className="text-foreground">Documentation</strong> mode generates a complete, production-grade
              README.md with at least 4 Mermaid diagrams. The output includes:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {[
                "Architecture overview with diagrams",
                "Setup & installation instructions",
                "API reference with tables",
                "Data flow sequence diagrams",
                "Database ER diagrams",
                "Component documentation",
                "Deployment guide",
                "Troubleshooting section",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <Download className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Download:</strong> In Documentation mode, a prominent "Download .md" button
                appears after analysis. Click it to save the complete documentation as a markdown file.
              </p>
            </div>
          </section>

          {/* Follow-Up */}
          <section id="follow-up" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Follow-Up Questions
            </h2>
            <p className="text-muted-foreground mb-4">
              After any analysis completes, a follow-up input appears below the output. Type a specific question
              and the AI will answer using the same code context — no need to re-paste.
            </p>
            <div className="bg-card border border-border/50 rounded-xl p-5">
              <p className="text-sm font-semibold mb-2">Example follow-up questions:</p>
              <ul className="space-y-1.5">
                {[
                  '"How would I add rate limiting to the API endpoints?"',
                  '"What happens if the database connection fails?"',
                  '"Can you explain the authentication flow in more detail?"',
                  '"Generate tests specifically for the user service"',
                ].map((q) => (
                  <li key={q} className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                    <span className="italic">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* History */}
          <section id="history" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Analysis History
            </h2>
            <p className="text-muted-foreground mb-4">
              Every analysis is automatically saved to your account. Access your history anytime:
            </p>
            <ul className="space-y-3 mb-4">
              {[
                { icon: History, text: "Click the clock icon in the header to open the history panel" },
                { icon: Search, text: "Search analyses by title or question" },
                { icon: CheckCircle, text: "Click any entry to instantly replay the full analysis" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Each entry shows the analysis mode badge, input source icon, and relative timestamp. You can delete individual
              entries or clear all history.
            </p>
          </section>

          {/* Sharing */}
          <section id="sharing" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Sharing Analyses
            </h2>
            <Step number={1} title="Complete an analysis">
              Run any analysis to completion.
            </Step>
            <Step number={2} title="Click Share">
              Click the <Share2 className="h-3.5 w-3.5 inline text-primary" /> Share button in the output header.
            </Step>
            <Step number={3} title="Copy the link">
              A unique short link is generated. Recipients can view the full analysis <strong className="text-foreground">without signing in</strong>.
            </Step>
          </section>

          {/* Dashboard */}
          <section id="dashboard" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Usage Dashboard
            </h2>
            <p className="text-muted-foreground mb-4">
              Click <BarChart3 className="h-3.5 w-3.5 inline text-primary" /> <strong className="text-foreground">Stats</strong> in the header to view your analytics dashboard:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard icon={BarChart3} title="Total Analyses" description="Track how many analyses you've run across all modes and input types." />
              <FeatureCard icon={CheckCircle} title="Streak Counter" description="Current and best consecutive-day streaks. Stay consistent!" />
              <FeatureCard icon={Building2} title="Mode Breakdown" description="Pie chart showing which analysis modes you use most frequently." />
              <FeatureCard icon={Zap} title="Language Detection" description="Auto-detected programming languages across all your analyzed code." />
            </div>
          </section>

          {/* Export */}
          <section id="export" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Exporting Results
            </h2>
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left p-4 font-semibold">Action</th>
                    <th className="text-left p-4 font-semibold">Where</th>
                    <th className="text-left p-4 font-semibold">Output</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="p-4 font-medium">Copy</td>
                    <td className="p-4 text-muted-foreground">Output header → "Copy"</td>
                    <td className="p-4 text-muted-foreground">Raw markdown to clipboard</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="p-4 font-medium">Export</td>
                    <td className="p-4 text-muted-foreground">Output header → "Export"</td>
                    <td className="p-4 text-muted-foreground">.md file download</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Download .md</td>
                    <td className="p-4 text-muted-foreground">Documentation mode only</td>
                    <td className="p-4 text-muted-foreground">Prominent download button</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Themes */}
          <section id="themes" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Themes & Settings
            </h2>
            <p className="text-muted-foreground mb-4">
              Toggle between themes using the theme button in the header:
            </p>
            <div className="flex gap-3 mb-4">
              {[
                { icon: Sun, label: "Light", desc: "Clean, bright interface" },
                { icon: Moon, label: "Dark", desc: "Easy on the eyes, default" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-4 flex-1">
                  <t.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              The app also respects your <strong className="text-foreground">system preference</strong> setting.
            </p>
          </section>

          {/* Tips */}
          <section id="tips" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Tips & Best Practices
            </h2>
            <div className="space-y-3">
              {[
                { title: "Be specific with code input", desc: "Smaller, focused code snippets get more precise analysis than entire 10,000-line codebases." },
                { title: "Use follow-up questions", desc: "After an initial analysis, drill into specific areas instead of re-running the entire analysis." },
                { title: "Try different modes on the same code", desc: "Run Security first, then Best Practices, then Test Gen — each reveals different insights." },
                { title: "Use GitHub integration for full context", desc: "Fetching from GitHub includes the file tree, giving the AI structural context that paste mode misses." },
                { title: "Add GitHub tokens for private repos", desc: "Your token is never stored — it's sent once to fetch the code and discarded." },
                { title: "Export documentation early", desc: "Use the Documentation mode on your repo early in development to establish a living doc you can update." },
              ].map((tip) => (
                <div key={tip.title} className="bg-card border border-border/50 rounded-xl p-4">
                  <p className="text-sm font-semibold mb-0.5">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-14 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">#</span> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                { q: "Is my code stored or shared?", a: "Your analysis history is stored in your private account and is only accessible to you. Shared analyses are public via their unique link, but the link is unguessable." },
                { q: "Can I analyze private GitHub repositories?", a: "Yes! Click 'Private repo? Add token' and paste a GitHub Personal Access Token. The token is used once for the API request and is never stored." },
                { q: "What languages are supported?", a: "CodeLens analyzes any programming language. The AI is trained on TypeScript, JavaScript, Python, Rust, Go, Java, SQL, and many more." },
                { q: "How large can my code input be?", a: "For pasted code, there's no hard limit but the AI context window is optimized for ~60KB. GitHub fetches are automatically capped at 40 files / 60KB." },
                { q: "Can I use CodeLens without signing up?", a: "Authentication is required to use the analysis features. Shared analysis links can be viewed by anyone without signing in." },
                { q: "What AI model powers the analysis?", a: "CodeLens uses Google's Gemini 3 Flash model via a secure AI gateway, optimized for code understanding and generation." },
                { q: "Are Mermaid diagrams always included?", a: "Most modes (Architecture, Request Flow, Knowledge Graph, Impact Analysis, Documentation) include Mermaid diagrams. If a diagram has a syntax error, the raw code is displayed as a fallback." },
              ].map((faq) => (
                <div key={faq.q} className="bg-card border border-border/50 rounded-xl p-5">
                  <p className="font-semibold text-sm mb-2">{faq.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center py-10 border-t border-border/50">
            <h2 className="text-xl font-bold mb-2">Ready to analyze?</h2>
            <p className="text-muted-foreground text-sm mb-6">Start understanding any codebase in seconds.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Braces className="h-4 w-4" />
              Open CodeLens
            </Link>
          </div>
        </article>
      </main>

      <footer className="border-t border-border/50 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          Powered by AI · Built with Lovable
        </div>
      </footer>
    </div>
  );
}
