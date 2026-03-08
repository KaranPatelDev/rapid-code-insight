import { useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AnalysisOutputProps {
  content: string;
  isStreaming: boolean;
}

export function AnalysisOutput({ content, isStreaming }: AnalysisOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content && !isStreaming) return null;

  return (
    <div className="relative mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isStreaming ? "bg-accent animate-pulse" : "bg-primary"}`} />
          <span className="text-sm font-medium text-muted-foreground">
            {isStreaming ? "Analyzing..." : "Analysis Complete"}
          </span>
        </div>
        {content && (
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
          </Button>
        )}
      </div>

      <div
        ref={containerRef}
        className="bg-card border border-border/50 rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
      >
        <MarkdownRenderer content={content} />
        {isStreaming && <span className="inline-block w-2 h-5 bg-accent ml-0.5 cursor-blink" />}
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown rendering
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] p-4 rounded-lg overflow-x-auto text-sm border border-border/30">
            <code>{codeContent}</code>
          </pre>
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3);
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="text-lg font-semibold mt-5 mb-2 text-foreground">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="text-2xl font-bold mt-6 mb-3 text-foreground">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="ml-4 text-foreground/90 list-disc">
          <InlineMarkdown text={line.slice(2)} />
        </li>
      );
    } else if (line.match(/^\d+\. /)) {
      const text = line.replace(/^\d+\.\s/, "");
      elements.push(
        <li key={key++} className="ml-4 text-foreground/90 list-decimal">
          <InlineMarkdown text={text} />
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="text-foreground/90 leading-relaxed"><InlineMarkdown text={line} /></p>);
    }
  }

  if (inCodeBlock && codeContent) {
    elements.push(
      <pre key={key++} className="bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] p-4 rounded-lg overflow-x-auto text-sm border border-border/30">
        <code>{codeContent}</code>
      </pre>
    );
  }

  return <>{elements}</>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle inline code and bold
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] px-1.5 py-0.5 rounded text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
