import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Code2, Sparkles, Upload } from "lucide-react";

interface CodeInputProps {
  onSubmit: (code: string, question?: string) => void;
  isLoading: boolean;
}

export function CodeInput({ onSubmit, isLoading }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (!code.trim()) return;
    onSubmit(code, question || undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target?.result as string || "");
    };
    reader.readAsText(file);
  };

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
      <div className="relative">
        <div className="absolute top-3 left-3 flex items-center gap-2 text-muted-foreground z-10">
          <Code2 className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-wider">Paste your code</span>
        </div>
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your code, file structure, or entire repository contents here..."
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
                Upload
              </span>
            </Button>
            <input type="file" className="hidden" accept=".ts,.tsx,.js,.jsx,.py,.rs,.go,.java,.rb,.php,.css,.html,.json,.yaml,.yml,.toml,.md,.txt" onChange={handleFileUpload} />
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
