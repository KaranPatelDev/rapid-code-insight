import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { owner, repo, token } = await req.json();
    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "owner and repo are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch repo tree using GitHub API (public repos, no auth needed)
    const treeResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeLens-AI" } }
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

    // Filter to code files only, skip large/binary files
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
        // Skip files in ignored directories
        if (path.split("/").some((seg: string) => skipDirs.has(seg))) return false;
        // Check extension or known config files
        const ext = "." + path.split(".").pop()?.toLowerCase();
        const basename = path.split("/").pop()?.toLowerCase() || "";
        return codeExtensions.has(ext) || ["dockerfile", "makefile", "procfile", "gemfile", "rakefile"].includes(basename);
      })
      .slice(0, 40); // Limit to 40 files to stay within token limits

    // Build file structure overview
    let content = `# Repository: ${owner}/${repo}\n\n`;
    content += `## File Structure\n\`\`\`\n`;
    for (const item of tree.filter((i: any) => i.type === "blob").slice(0, 200)) {
      content += `${item.path}\n`;
    }
    content += `\`\`\`\n\n`;

    // Fetch important files content (limit total size)
    let totalSize = 0;
    const maxTotalSize = 60000; // ~60KB of code

    // Prioritize key files
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
      // Skip files larger than 10KB
      if (file.size && file.size > 10000) continue;

      try {
        const fileResp = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
          { headers: { Accept: "application/vnd.github.v3.raw", "User-Agent": "CodeLens-AI" } }
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
