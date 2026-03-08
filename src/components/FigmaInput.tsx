import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Figma, Upload, Link, Sparkles } from "lucide-react";

interface FigmaInputProps {
  onSubmit: (content: string, question?: string) => void;
  isLoading: boolean;
}

export function FigmaInput({ onSubmit, isLoading }: FigmaInputProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [question, setQuestion] = useState("");
  const [inputMode, setInputMode] = useState<"link" | "paste">("link");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const results: string[] = [];

    for (const file of fileArray.slice(0, 20)) {
      try {
        const text = await file.text();
        const path = (file as any).webkitRelativePath || file.name;
        results.push(`// === ${path} ===\n${text}`);
      } catch {
        // Skip binary files
      }
    }

    if (results.length > 0) {
      setPastedContent(results.join("\n\n"));
      setInputMode("paste");
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

  const handleSubmit = () => {
    if (inputMode === "link") {
      if (!figmaUrl.trim()) return;
      const content = `[Figma Design Link]: ${figmaUrl.trim()}\n\nPlease analyze this Figma design for UI/UX improvements. If you cannot access the link directly, provide general UI/UX best practices and a review checklist based on common design patterns.`;
      onSubmit(content, question || undefined);
    } else {
      if (!pastedContent.trim()) return;
      onSubmit(pastedContent, question || undefined);
    }
  };

  const isFigmaUrl = (url: string) => {
    return /figma\.com\/(file|design|proto|board)\//.test(url);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode("link")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            inputMode === "link"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground border border-border/50"
          }`}
        >
          <Link className="h-3.5 w-3.5" />
          Figma Link
        </button>
        <button
          onClick={() => setInputMode("paste")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            inputMode === "paste"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground border border-border/50"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Paste / Upload
        </button>
      </div>

      {inputMode === "link" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Figma className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Figma Design URL</span>
          </div>
          <Input
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/My-Design..."
            className="bg-card border-border/50 font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {figmaUrl && !isFigmaUrl(figmaUrl) && (
            <p className="text-xs text-amber-500">
              This doesn't look like a Figma URL. Expected format: figma.com/design/... or figma.com/file/...
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Paste a Figma file, prototype, or design link. The AI will analyze the design structure and provide UI/UX feedback.
          </p>
        </div>
      ) : (
        <div
          className={`relative transition-all ${dragOver ? "ring-2 ring-primary rounded-lg" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="absolute top-3 left-3 flex items-center gap-2 text-muted-foreground z-10">
            <Figma className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Design code or exported tokens</span>
          </div>
          {dragOver && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-20 flex items-center justify-center">
              <p className="text-primary font-medium">Drop design files here</p>
            </div>
          )}
          <Textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste frontend code (HTML/CSS/React), Figma exported tokens, or design specifications..."
            className="min-h-[250px] pt-10 font-mono text-sm bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] border-border/50 resize-y placeholder:text-muted-foreground/40 focus-visible:ring-primary/30"
          />
          <div className="absolute bottom-3 right-3">
            <label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Files
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".ts,.tsx,.js,.jsx,.css,.html,.json,.svg,.fig,.sketch,.xd,.md,.txt"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a specific design question (optional)..."
        className="bg-card border-border/50"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />

      <Button
        onClick={handleSubmit}
        disabled={isLoading || (inputMode === "link" ? !figmaUrl.trim() : !pastedContent.trim())}
        className="w-full glow-primary bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Reviewing Design...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Review UI/UX Design
          </span>
        )}
      </Button>
    </div>
  );
}
