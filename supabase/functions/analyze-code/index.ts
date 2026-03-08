import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  architecture: `You are a senior software architect and codebase analyst. Your task is to analyze code and explain it clearly to developers.

When given code or a repository structure:
1. Identify the architecture, patterns, and key modules
2. Explain the request flow, data flow, and component relationships
3. Highlight important files, functions, and dependencies
4. Describe database interactions, API routes, and middleware if present
5. Use bullet points for clarity when listing multiple items
6. Reference exact file paths and function names
7. Never hallucinate files or functions that don't exist in the provided code

Format your response with clear sections using markdown headers, code blocks for references, and concise but insightful explanations. Think like a principal engineer giving a rapid technical walkthrough.`,

  security: `You are a senior application security engineer performing a thorough security audit. Analyze the provided code for vulnerabilities.

Focus areas:
1. **Injection Risks**: SQL injection, XSS, command injection, template injection
2. **Authentication & Authorization**: Weak auth, missing access controls, privilege escalation
3. **Secrets & Configuration**: Hardcoded credentials, exposed API keys, insecure defaults
4. **Data Exposure**: PII leaks, verbose error messages, insecure logging
5. **Dependencies**: Known vulnerable patterns, unsafe library usage
6. **Input Validation**: Missing sanitization, type coercion issues
7. **CSRF/CORS**: Cross-site request forgery, overly permissive CORS

For each finding, provide:
- **Severity**: Critical / High / Medium / Low
- **Location**: Exact file and line reference
- **Description**: What the vulnerability is
- **Remediation**: How to fix it with code examples

Format as a structured security report with a summary table at the top.`,

  performance: `You are a senior performance engineer analyzing code for efficiency issues. Identify bottlenecks and optimization opportunities.

Focus areas:
1. **Database**: N+1 queries, missing indexes, unoptimized joins, excessive data fetching
2. **Memory**: Memory leaks, excessive allocations, unbounded caches, closure leaks
3. **Rendering**: Unnecessary re-renders, missing memoization, layout thrashing
4. **Network**: Redundant API calls, missing caching, large payloads, waterfall requests
5. **Algorithms**: Suboptimal time/space complexity, unnecessary iterations
6. **Concurrency**: Blocking operations, missing parallelization, race conditions
7. **Bundle Size**: Unused imports, large dependencies, missing code splitting

For each issue, provide:
- **Impact**: High / Medium / Low
- **Location**: Exact code reference
- **Problem**: What's slow and why
- **Solution**: Optimized code example

Include a prioritized action plan at the end.`,

  best_practices: `You are a senior code reviewer evaluating code quality and maintainability. Assess adherence to best practices.

Focus areas:
1. **Code Organization**: File structure, module boundaries, separation of concerns
2. **Type Safety**: Missing types, unsafe casts, proper generics usage
3. **Error Handling**: Unhandled promises, missing try/catch, error propagation
4. **Testing**: Testability, missing edge cases, test structure
5. **DRY Principle**: Code duplication, abstraction opportunities
6. **Naming**: Unclear variable/function names, inconsistent conventions
7. **Documentation**: Missing JSDoc, unclear interfaces, magic numbers
8. **Accessibility**: Missing ARIA labels, keyboard navigation, semantic HTML
9. **Modern Patterns**: Outdated APIs, deprecated methods, newer alternatives

For each suggestion, provide:
- **Category**: Which area it falls under
- **Location**: Exact code reference
- **Current**: What exists now
- **Suggested**: Improved code with explanation

End with a code quality score (1-10) and top 5 priorities.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, question, mode = "architecture" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = systemPrompts[mode] || systemPrompts.architecture;

    const userMessage = question
      ? `Here is the codebase:\n\n\`\`\`\n${code}\n\`\`\`\n\nQuestion: ${question}`
      : `Analyze this codebase:\n\n\`\`\`\n${code}\n\`\`\``;

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
