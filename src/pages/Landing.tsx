import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Braces, Shield, Bug, TestTube, Wrench, GitPullRequest,
  Layers, Zap, ArrowRight, Star, Check, BookOpen
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
} as const;

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
} as const;

const features = [
  { icon: Layers, title: "Architecture Analysis", desc: "Understand patterns, modules, and dependency graphs at a glance." },
  { icon: Shield, title: "Security Scanning", desc: "Detect vulnerabilities, injection risks, and auth flaws instantly." },
  { icon: Bug, title: "AI Debugging", desc: "Find hidden bugs, edge cases, and race conditions automatically." },
  { icon: TestTube, title: "Test Generation", desc: "Auto-generate comprehensive test suites from your codebase." },
  { icon: Wrench, title: "Refactoring", desc: "Get actionable improvement suggestions with before/after diffs." },
  { icon: GitPullRequest, title: "PR Review", desc: "Submit a PR URL and get a thorough code review in seconds." },
  { icon: Zap, title: "Impact Analysis", desc: "Map the blast radius of any change across your entire codebase." },
  { icon: Braces, title: "Multi-Repo", desc: "Analyze cross-repository dependencies and shared patterns." },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Staff Engineer, Fintech",
    quote: "CodeLens found a critical auth bypass in our payment flow that three manual reviews missed. Absolute game-changer.",
    avatar: "SC",
  },
  {
    name: "Marcus Rivera",
    role: "Engineering Lead, SaaS",
    quote: "We cut our PR review time by 60%. The AI catches architectural drift before it becomes tech debt.",
    avatar: "MR",
  },
  {
    name: "Aisha Patel",
    role: "Solo Founder",
    quote: "As a solo dev, CodeLens is like having a senior engineer on call 24/7. The test generation alone saves me hours.",
    avatar: "AP",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 analyses per day", "All 13 analysis modes", "GitHub repo support", "Share results"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: ["50 analyses per day", "Priority processing", "PR review & multi-repo", "Analysis history", "Follow-up questions"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    features: ["Unlimited analyses", "Team workspaces", "Shared history & insights", "Priority support", "Custom integrations"],
    cta: "Contact Us",
    highlighted: false,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="AI-Powered Code Analysis"
        description="Understand any codebase in seconds. 13 AI-powered analysis modes for architecture, security, debugging, and more."
      />

      {/* Nav */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Braces className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 hidden sm:inline-block">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 hidden sm:inline-block">Pricing</a>
            <ThemeToggle />
            <Link to="/auth">
              <Button size="sm" variant="outline" className="text-xs">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="text-xs">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <motion.div
          className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Zap className="h-3 w-3" /> 13 specialized analysis modes
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Understand any codebase
            <br />
            <span className="text-primary">in seconds</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste code, connect GitHub repos, or submit PRs — get instant AI-powered insights on
            architecture, security, performance, and more.
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="text-sm gap-2 px-8 h-12 shadow-lg shadow-primary/25">
                Start Analyzing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/guide">
              <Button size="lg" variant="outline" className="text-sm gap-2 px-6 h-12">
                <BookOpen className="h-4 w-4" /> Read the Guide
              </Button>
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="text-xs text-muted-foreground mt-4">Free tier available · No credit card required</motion.p>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to understand code
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From security audits to architecture diagrams — 13 modes built for real engineering workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Trusted by engineers worldwide
            </h2>
            <p className="text-muted-foreground text-lg">
              See what developers are saying about CodeLens AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-card border border-border/50 rounded-xl p-6 flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Upgrade when you need more power.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card border rounded-xl p-6 flex flex-col relative ${
                  plan.highlighted
                    ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                    : "border-border/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to understand your code better?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of developers using CodeLens AI to ship faster, safer code.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-sm gap-2 px-8 h-12 shadow-lg shadow-primary/25">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Braces className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">CodeLens AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/guide" className="hover:text-foreground transition-colors">Guide</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <span>© {new Date().getFullYear()} CodeLens AI · Built with Lovable</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
