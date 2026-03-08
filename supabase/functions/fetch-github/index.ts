import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { owner, repo, token, pr_number } = await req.json();
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "owner and repo are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CodeLens-AI",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // PR diff mode
    if (pr_number) {
      // Fetch PR metadata
      const prResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`,
        { headers }
      );
      if (!prResp.ok) {
        return new Response(
          JSON.stringify({ error: prResp.status === 404 ? "PR not found or repository is private" : "Failed to fetch PR" }),
          { status: prResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const prData = await prResp.json();

      // Fetch PR diff
      const diffResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`,
        { headers: { ...headers, Accept: "application/vnd.github.v3.diff" } }
      );
      const diff = diffResp.ok ? await diffResp.text() : "Could not fetch diff";

      // Fetch PR files for summary
      const filesResp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/files?per_page=100`,
        { headers }
      );
      const files = filesResp.ok ? await filesResp.json() : [];

      let content = `# Pull Request: ${prData.title}\n\n`;
      content += `**Author**: ${prData.user?.login}\n`;
      content += `**Base**: ${prData.base?.ref} ← **Head**: ${prData.head?.ref}\n`;
      content += `**Status**: ${prData.state} | **Mergeable**: ${prData.mergeable ?? "unknown"}\n`;
      content += `**Changed files**: ${prData.changed_files} | **Additions**: +${prData.additions} | **Deletions**: -${prData.deletions}\n\n`;

      if (prData.body) {
        content += `## PR Description\n${prData.body}\n\n`;
      }

      content += `## Files Changed\n`;
      for (const f of files) {
        content += `- \`${f.filename}\` (+${f.additions}/-${f.deletions}) [${f.status}]\n`;
      }
      content += `\n`;

      // Truncate diff if too large
      const maxDiffSize = 50000;
      const truncatedDiff = diff.length > maxDiffSize ? diff.slice(0, maxDiffSize) + "\n\n... (diff truncated)" : diff;
      content += `## Diff\n\`\`\`diff\n${truncatedDiff}\n\`\`\`\n`;

      return new Response(
        JSON.stringify({ content, title: prData.title }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular repo fetch (existing logic)
    const treeResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      { headers }
    );

    if (!treeResp.ok) {
      const errText = await treeResp.text();
      console.error("GitHub tree error:", treeResp.status, errText);
      return new Response(
        JSON.stringify({ error: treeResp.status === 404 ? "Repository not found or is private" : "Failed to fetch repository" }),
        { status: treeResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const treeData = await treeResp.json();
    const tree = treeData.tree || [];

    const codeExtensions = new Set([
      ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java", ".rb", ".php",
      ".css", ".scss", ".html", ".json", ".yaml", ".yml", ".toml", ".md", ".txt",
      ".sql", ".sh", ".dockerfile", ".env.example", ".gitignore", ".config.js",
      ".config.ts", ".vue", ".svelte", ".kt", ".swift", ".c", ".cpp", ".h",
    ]);

    const skipDirs = new Set(["node_modules", ".git", "dist", "build", ".next", "vendor", "__pycache__", ".venv"]);

    const codeFiles = tree
      .filter((item: any) => {
        if (item.type !== "blob") return false;
        const path = item.path as string;
        if (path.split("/").some((seg: string) => skipDirs.has(seg))) return false;
        const ext = "." + path.split(".").pop()?.toLowerCase();
        const basename = path.split("/").pop()?.toLowerCase() || "";
        return codeExtensions.has(ext) || ["dockerfile", "makefile", "procfile", "gemfile", "rakefile"].includes(basename);
      })
      .slice(0, 40);

    let content = `# Repository: ${owner}/${repo}\n\n`;
    content += `## File Structure\n\`\`\`\n`;
    for (const item of tree.filter((i: any) => i.type === "blob").slice(0, 200)) {
      content += `${item.path}\n`;
    }
    content += `\`\`\`\n\n`;

    let totalSize = 0;
    const maxTotalSize = 60000;

    const priorityFiles = ["package.json", "Cargo.toml", "go.mod", "requirements.txt", "pyproject.toml", "README.md"];
    const sortedFiles = [...codeFiles].sort((a: any, b: any) => {
      const aName = a.path.split("/").pop() || "";
      const bName = b.path.split("/").pop() || "";
      const aPriority = priorityFiles.includes(aName) ? -1 : 0;
      const bPriority = priorityFiles.includes(bName) ? -1 : 0;
      return aPriority - bPriority;
    });

    for (const file of sortedFiles) {
      if (totalSize >= maxTotalSize) break;
      if (file.size && file.size > 10000) continue;

      try {
        const fileResp = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
          { headers: { ...headers, Accept: "application/vnd.github.v3.raw" } }
        );
        if (fileResp.ok) {
          const fileContent = await fileResp.text();
          if (fileContent.length + totalSize > maxTotalSize) continue;
          const ext = file.path.split(".").pop() || "";
          content += `## ${file.path}\n\`\`\`${ext}\n${fileContent}\n\`\`\`\n\n`;
          totalSize += fileContent.length;
        }
      } catch {
        // Skip files that fail to fetch
      }
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-github error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
