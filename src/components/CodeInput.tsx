import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Code2, Sparkles, Upload, FolderOpen } from "lucide-react";

interface CodeInputProps {
  onSubmit: (code: string, question?: string) => void;
  isLoading: boolean;
}

export function CodeInput({ onSubmit, isLoading }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!code.trim()) return;
    onSubmit(code, question || undefined);
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const textExtensions = /\.(ts|tsx|js|jsx|py|rs|go|java|rb|php|css|html|json|yaml|yml|toml|md|txt|sql|sh|bash|c|cpp|h|hpp|cs|swift|kt|scala|vue|svelte|astro|prisma|graphql|gql|env|dockerfile|makefile|xml|csv|ini|cfg|conf|gitignore|editorconfig|prettierrc|eslintrc|fig|sketch|xd|fig|sketch|xd)$/i;
    
    const results: string[] = [];

    // Sort files by path for tree structure
    const sortedFiles = fileArray
      .filter((f) => textExtensions.test(f.name) || !f.name.includes("."))
      .sort((a, b) => {
        const pathA = (a as any).webkitRelativePath || a.name;
        const pathB = (b as any).webkitRelativePath || b.name;
        return pathA.localeCompare(pathB);
      });

    for (const file of sortedFiles.slice(0, 50)) {
      try {
        const text = await file.text();
        const path = (file as any).webkitRelativePath || file.name;
        results.push(`// === ${path} ===\n${text}`);
      } catch {
        // Skip binary files
      }
    }

    if (results.length > 0) {
      const combined = results.join("\n\n");
      setCode(combined);
      if (sortedFiles.length > 50) {
        // Notify truncation via the question field hint
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
    } catch {
      // clipboard API may not be available
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative transition-all ${
          dragOver ? "ring-2 ring-primary rounded-lg" : ""
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="absolute top-3 left-3 flex items-center gap-2 text-muted-foreground z-10">
          <Code2 className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-wider">Paste your code</span>
        </div>
        {dragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-20 flex items-center justify-center">
            <p className="text-primary font-medium">Drop files or folders here</p>
          </div>
        )}
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your code, drag & drop files/folders, or upload..."
          className="min-h-[300px] pt-10 font-mono text-sm bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] border-border/50 resize-y placeholder:text-muted-foreground/40 focus-visible:ring-primary/30"
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Paste
          </Button>
          <label>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-3 w-3 mr-1" />
                Files
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".ts,.tsx,.js,.jsx,.py,.rs,.go,.java,.rb,.php,.css,.html,.json,.yaml,.yml,.toml,.md,.txt,.sql,.sh,.c,.cpp,.h,.cs,.swift,.kt,.vue,.svelte,.prisma,.gra,.fig,.sketch,.xdphql,.xml,.csv"
              onChange={handleFileUpload}
            />
          </label>
          <label>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              asChild
            >
              <span>
                <FolderOpen className="h-3 w-3 mr-1" />
                Folder
              </span>
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              {...({ webkitdirectory: "", directory: "" } as any)}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a specific question about the code (optional)..."
        className="bg-card border-border/50"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !code.trim()}
        className="w-full glow-primary bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Analyze Codebase
          </span>
        )}
      </Button>
    </div>
  );
}
