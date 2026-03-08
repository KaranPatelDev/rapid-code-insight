import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Config ---
const MAX_CODE_SIZE = 500_000; // 500KB
const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 50, team: 0 }; // 0 = unlimited
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 3; // max requests per window

// Simple in-memory rate limiter (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// --- System Prompts ---
const systemPrompts: Record<string, string> = {
  architecture: `You are a senior software architect. Analyze the codebase and explain its architecture.

Deliverables:
1. High-level architecture overview with a \`\`\`mermaid diagram
2. Key modules, patterns (MVC, microservices, event-driven, etc.)
3. Component relationships and dependency graph
4. Database interactions, API routes, middleware
5. File/folder structure rationale

Reference exact file paths. Include at least one mermaid diagram.`,

  request_flow: `You are a senior backend engineer specializing in request flow tracing. Trace how data and requests flow through the codebase.

Deliverables:
1. **Entry Points**: List all API endpoints, event handlers, scheduled jobs
2. **Request Lifecycle**: For each major flow, trace the full path from entry to response using a \`\`\`mermaid sequence diagram
3. **Data Transformations**: Show how data changes shape at each step
4. **Side Effects**: Database writes, external API calls, queue messages, cache updates
5. **Error Paths**: How errors propagate and where they're caught
6. **Middleware Chain**: Authentication, validation, logging layers

Include mermaid sequence diagrams for the top 3 most important flows.`,

  security: `You are a senior application security engineer performing a thorough security audit.

Focus areas:
1. **Injection Risks**: SQL injection, XSS, command injection, template injection
2. **Authentication & Authorization**: Weak auth, missing access controls, privilege escalation
3. **Secrets & Configuration**: Hardcoded credentials, exposed API keys, insecure defaults
4. **Data Exposure**: PII leaks, verbose error messages, insecure logging
5. **Dependencies**: Known vulnerable patterns, unsafe library usage
6. **Input Validation**: Missing sanitization, type coercion issues
7. **CSRF/CORS**: Cross-site request forgery, overly permissive CORS

For each finding: **Severity** (Critical/High/Medium/Low), **Location**, **Description**, **Remediation** with code examples.
Include a summary table at the top with severity counts.`,

  performance: `You are a senior performance engineer. Identify bottlenecks and optimization opportunities.

Focus areas:
1. **Database**: N+1 queries, missing indexes, unoptimized joins, excessive data fetching
2. **Memory**: Memory leaks, excessive allocations, unbounded caches
3. **Rendering**: Unnecessary re-renders, missing memoization, layout thrashing
4. **Network**: Redundant API calls, missing caching, large payloads, waterfall requests
5. **Algorithms**: Suboptimal complexity, unnecessary iterations
6. **Bundle Size**: Unused imports, large dependencies, missing code splitting

For each: **Impact** (High/Medium/Low), **Location**, **Problem**, **Solution** with optimized code.
End with a prioritized action plan.`,

  best_practices: `You are a senior code reviewer evaluating code quality and maintainability.

Focus areas:
1. Code organization, module boundaries, separation of concerns
2. Type safety, missing types, unsafe casts
3. Error handling, unhandled promises
4. DRY violations, abstraction opportunities
5. Naming clarity, documentation gaps
6. Accessibility, semantic HTML
7. Modern patterns vs deprecated APIs

For each: **Category**, **Location**, **Current**, **Suggested** with improved code.
End with a code quality score (1-10) and top 5 priorities.`,

  debugging: `You are an expert AI debugger. Analyze the code to find bugs, logical errors, and potential runtime failures.

Deliverables:
1. **Bug Report**: List every bug found with:
   - **Type**: Logic error / Race condition / Type error / Null reference / Off-by-one / State management / Memory leak
   - **Location**: Exact file and line
   - **Description**: What's wrong and when it manifests
   - **Reproduction**: Steps or conditions that trigger it
   - **Fix**: Corrected code with explanation

2. **Edge Cases**: Conditions the code doesn't handle (empty arrays, null values, concurrent access, network failures)

3. **Silent Failures**: Places where errors are swallowed, data is silently wrong, or undefined behavior occurs

4. **State Inconsistencies**: Where state can get out of sync between components, database, or cache

Include a severity-ranked summary table.`,

  impact_analysis: `You are a senior engineer performing impact analysis on a codebase. Analyze what would happen if specific parts change.

Deliverables:
1. **Dependency Map**: Create a \`\`\`mermaid graph showing which modules depend on which
2. **High-Risk Modules**: Identify the most interconnected/fragile components
3. **Change Impact Matrix**: For each major module, list what would break if it changes
4. **Ripple Effects**: Trace how a change in one file cascades through the system
5. **Safe vs Dangerous Refactors**: Categorize potential changes by risk level
6. **Missing Abstractions**: Where tight coupling makes changes risky
7. **Test Coverage Gaps**: Areas where changes would be unprotected by tests

Include a risk heatmap as a mermaid diagram.`,

  test_generation: `You are a senior test engineer. Generate comprehensive test suites for the provided code.

Deliverables:
1. **Unit Tests**: For each function/method, generate tests covering:
   - Happy path with expected inputs
   - Edge cases (empty, null, boundary values)
   - Error cases and exception handling
   - Type edge cases

2. **Integration Tests**: Test interactions between modules:
   - API endpoint tests with request/response
   - Database operation tests
   - Authentication flow tests

3. **Component Tests** (if React/UI code):
   - Render tests
   - User interaction tests
   - State management tests
   - Accessibility tests

4. **Test Utilities**: Helper functions, fixtures, mocks needed

Write actual runnable test code using appropriate frameworks (Jest, Vitest, pytest, etc.) based on the detected language. Include setup/teardown. Group tests logically.`,

  refactoring: `You are a senior software architect providing AI-powered refactoring suggestions.

Deliverables:
1. **Code Smells**: Identify and categorize:
   - Long methods / God classes
   - Duplicated logic
   - Deep nesting
   - Primitive obsession
   - Feature envy
   - Shotgun surgery patterns

2. **Refactoring Plan**: For each smell, provide:
   - **Pattern**: Which refactoring pattern to apply (Extract Method, Strategy, Observer, etc.)
   - **Before**: Current code
   - **After**: Refactored code
   - **Benefit**: Why this improves the codebase
   - **Risk**: What could go wrong

3. **Architecture Improvements**: Higher-level restructuring suggestions with \`\`\`mermaid diagrams showing before/after

4. **Migration Path**: Step-by-step plan to implement refactorings safely, ordered by impact and risk

Prioritize suggestions by effort-to-impact ratio.`,

  knowledge_graph: `You are building a developer knowledge graph from this codebase. Map the entire system as an interconnected knowledge base.

Deliverables:
1. **Entity Map**: Identify all key entities (models, services, controllers, utilities, types) with a \`\`\`mermaid class diagram

2. **Relationship Graph**: Show how entities relate:
   - Dependencies (imports/requires)
   - Data flow (producer → consumer)
   - Inheritance / composition
   - API contracts

3. **Domain Glossary**: Define every domain-specific term, type, and concept found in the code

4. **Onboarding Guide**: A structured walkthrough for a new developer:
   - Where to start reading
   - Key abstractions to understand first
   - Common patterns used throughout
   - Gotchas and non-obvious conventions

5. **Decision Log**: Infer architectural decisions from the code (why certain patterns were chosen)

Include multiple mermaid diagrams for different views of the system.`,

  multi_repo: `You are a senior architect analyzing multiple repositories together to understand how they interact as a system.

Deliverables:
1. **System Overview**: How these repos work together as a unified system, with a \`\`\`mermaid diagram

2. **Inter-Repo Dependencies**: Shared types, API contracts, message formats, database schemas between repos

3. **Communication Patterns**: How repos communicate (REST, gRPC, events, shared DB, file system)

4. **Shared Patterns**: Common patterns, utilities, or conventions used across repos

5. **Inconsistencies**: Where repos diverge in patterns, naming, error handling, or conventions

6. **Integration Points**: The exact files/functions where repos connect

7. **Deployment Dependencies**: Which repos need to be deployed together, ordering constraints

Include mermaid diagrams showing the system architecture and data flow between repos.`,

  pr_diff: `You are a senior code reviewer analyzing a Pull Request diff.

Structure your review:

## Summary
Brief 2-3 sentence summary of what this PR does.

## Impact Analysis
- What systems/features are affected?
- Is this a breaking change?
- What's the blast radius if something goes wrong?

## Code Review Findings
For each finding:
- **File**: exact path
- **Severity**: Critical / Major / Minor / Nit
- **Issue**: What's wrong or could be improved
- **Suggestion**: How to fix it

## Potential Regressions
- What existing functionality might break?
- Edge cases not covered?
- Missing tests?

## Architecture Impact
Include a mermaid diagram if relevant.

## Verdict
- APPROVE / REQUEST CHANGES / COMMENT
- Top 3 things to address before merging

Be specific, reference exact files and line ranges.`,

  documentation: `You are a senior technical writer generating production-grade documentation for a codebase. Generate a complete, publish-ready README.md and supplementary docs.

Deliverables (output as a single markdown document):

# Project Name

## Overview
- 1-2 paragraph executive summary of what this project does, who it's for, and why it exists.

## Table of Contents
- Auto-generated from all sections below.

## Architecture
- High-level system architecture with a \`\`\`mermaid graph TD diagram
- Key design decisions and rationale
- Technology stack breakdown

## Getting Started
### Prerequisites
- List all required tools, runtimes, and versions
### Installation
- Step-by-step setup instructions with shell commands
### Configuration
- Environment variables table (name, description, required, default)
### Running Locally
- Dev server, build, and test commands

## Project Structure
- Directory tree with descriptions of each major folder/file
- Use code blocks for the tree

## API Reference
- For each endpoint/function: method, path, parameters, request/response examples
- Use tables for parameters
- Include authentication requirements

## Data Flow
- End-to-end request lifecycle with a \`\`\`mermaid sequence diagram
- Show how data moves from user input through the system to response

## Component Documentation (if frontend)
- Key components with their props, usage examples
- State management patterns
- Routing structure with a \`\`\`mermaid flowchart

## Database Schema (if applicable)
- Entity relationship diagram using \`\`\`mermaid erDiagram
- Table descriptions with column details

## Authentication & Authorization
- Auth flow diagram using \`\`\`mermaid sequence diagram
- Role-based access patterns

## Deployment
- Deployment architecture with \`\`\`mermaid diagram
- CI/CD pipeline description
- Environment-specific configurations

## Testing
- Testing strategy and frameworks used
- How to run tests
- Coverage expectations

## Troubleshooting
- Common issues and solutions in a table format
- Debug tips

## Contributing
- Code style guidelines
- PR process
- Branch naming conventions

## Changelog
- Version history template

---

IMPORTANT RULES:
- Include AT LEAST 4 mermaid diagrams (architecture, data flow, ER diagram, deployment)
- Every section must have real, specific content based on the actual code — no placeholders
- Use proper markdown formatting: tables, code blocks, badges, links
- Write for a developer who has never seen this codebase
- Make it comprehensive enough to onboard a new team member
- Include copy-pasteable commands wherever possible`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { code, question, mode = "architecture" } = body;

    // --- Input validation ---
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Code input is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (code.length > MAX_CODE_SIZE) {
      return new Response(JSON.stringify({ error: `Code input too large. Maximum size is ${MAX_CODE_SIZE / 1000}KB.` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (question && typeof question === "string" && question.length > 2000) {
      return new Response(JSON.stringify({ error: "Question too long. Maximum 2000 characters." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Extract user from JWT for rate limiting & usage caps ---
    const authHeader = req.headers.get("authorization") || "";
    let userId: string | null = null;
    let rateLimitKey = "anon";

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      // Try to get user from Supabase
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          rateLimitKey = userId;
        }
      } catch { /* continue as anon */ }
    }

    // --- Per-user rate limiting (short window) ---
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait a few seconds and try again." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Daily usage cap (for authenticated users) ---
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const today = new Date().toISOString().split("T")[0];

      const { data: usage } = await supabase
        .from("daily_usage")
        .select("analysis_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

      const currentCount = usage?.analysis_count || 0;

      if (currentCount >= DAILY_LIMIT) {
        return new Response(JSON.stringify({ error: `Daily analysis limit reached (${DAILY_LIMIT}/day). Try again tomorrow.` }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert usage count
      await supabase.from("daily_usage").upsert(
        { user_id: userId, usage_date: today, analysis_count: currentCount + 1 },
        { onConflict: "user_id,usage_date" }
      );
    }

    // --- AI analysis ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = systemPrompts[mode] || systemPrompts.architecture;

    let userMessage: string;
    if (question) {
      userMessage = `Here is the codebase:\n\n\`\`\`\n${code}\n\`\`\`\n\nQuestion: ${question}`;
    } else if (mode === "pr_diff") {
      userMessage = `Review this Pull Request:\n\n${code}`;
    } else if (mode === "multi_repo") {
      userMessage = `Analyze these repositories together as a system:\n\n${code}`;
    } else if (mode === "test_generation") {
      userMessage = `Generate comprehensive tests for this code:\n\n\`\`\`\n${code}\n\`\`\``;
    } else if (mode === "debugging") {
      userMessage = `Debug this code — find all bugs and potential issues:\n\n\`\`\`\n${code}\n\`\`\``;
    } else if (mode === "refactoring") {
      userMessage = `Provide refactoring suggestions for this code:\n\n\`\`\`\n${code}\n\`\`\``;
    } else if (mode === "documentation") {
      userMessage = `Generate comprehensive, production-grade documentation for this codebase:\n\n\`\`\`\n${code}\n\`\`\``;
    } else {
      userMessage = `Analyze this codebase:\n\n\`\`\`\n${code}\n\`\`\``;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
