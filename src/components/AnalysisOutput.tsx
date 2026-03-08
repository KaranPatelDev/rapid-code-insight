import { useEffect, useRef, useState, useCallback } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import mermaid from "mermaid";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("rs", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Space Grotesk, sans-serif",
});

interface AnalysisOutputProps {
  content: string;
  isStreaming: boolean;
  shareData?: {
    title: string;
    code: string;
    question?: string;
    source: string;
  };
}

export function AnalysisOutput({ content, isStreaming, shareData }: AnalysisOutputProps) {
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

  const handleExportMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shareData?.title || "analysis"}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex items-center gap-1">
          {content && !isStreaming && (
            <Button variant="ghost" size="sm" onClick={handleExportMarkdown} className="text-muted-foreground hover:text-foreground">
              <Download className="h-3.5 w-3.5" />
              <span className="ml-1 text-xs">Export</span>
            </Button>
          )}
          {content && !isStreaming && shareData && (
            <ShareButton
              title={shareData.title}
              code={shareData.code}
              question={shareData.question}
              output={content}
              source={shareData.source}
            />
          )}
          {content && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-card border border-border/50 rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
      >
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
        {isStreaming && <span className="inline-block w-2 h-5 bg-accent ml-0.5 cursor-blink" />}
      </div>
    </div>
  );
}

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] p-4 rounded-lg overflow-x-auto text-sm border border-border/30">
        <span className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground opacity-60">mermaid</span>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 p-4 bg-card border border-border/30 rounded-lg overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function HighlightedCode({ code, lang }: { code: string; lang: string }) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          codeRef.current.innerHTML = hljs.highlight(code, { language: lang }).value;
        } else {
          const result = hljs.highlightAuto(code);
          codeRef.current.innerHTML = result.value;
        }
      } catch {
        codeRef.current.textContent = code;
      }
    }
  }, [code, lang]);

  return (
    <pre className="bg-[hsl(var(--code-bg))] text-[hsl(var(--code-foreground))] p-4 rounded-lg overflow-x-auto text-sm border border-border/30 relative group">
      {lang && (
        <span className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground opacity-60">
          {lang}
        </span>
      )}
      <code ref={codeRef} className="hljs">{code}</code>
    </pre>
  );
}

function MarkdownRenderer({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        if (codeLang === "mermaid") {
          elements.push(<MermaidDiagram key={key++} code={codeContent} />);
        } else {
          elements.push(<HighlightedCode key={key++} code={codeContent} lang={codeLang} />);
        }
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
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

  // If still in a code block (streaming), render what we have so far
  if (inCodeBlock && codeContent) {
    if (codeLang === "mermaid" && !isStreaming) {
      elements.push(<MermaidDiagram key={key++} code={codeContent} />);
    } else {
      elements.push(<HighlightedCode key={key++} code={codeContent} lang={codeLang} />);
    }
  }

  return <>{elements}</>;
}

function InlineMarkdown({ text }: { text: string }) {
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
