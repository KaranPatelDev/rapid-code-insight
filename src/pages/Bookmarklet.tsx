import { useState } from "react";
import { Copy, Check, Braces, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Bookmarklet() {
  const [copied, setCopied] = useState(false);

  const origin = window.location.origin;
  const bookmarkletCode = `javascript:void(window.open('${origin}/widget','CodeLens','width=520,height=700,scrollbars=yes,resizable=yes'))`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Braces className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CodeLens</span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Bookmarklet Widget</h1>
        <p className="text-muted-foreground mb-10 text-lg">
          Analyze code from any webpage with a single click.
        </p>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              Drag to bookmarks bar
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Drag the button below into your browser's bookmarks bar:
            </p>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              href={bookmarkletCode}
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm cursor-grab active:cursor-grabbing hover:bg-primary/90 transition-colors no-underline"
              draggable
            >
              <Braces className="h-4 w-4" />
              CodeLens AI
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              Use it
            </h2>
            <p className="text-sm text-muted-foreground">
              On any webpage, click the bookmarklet in your bookmarks bar. A popup window opens with the CodeLens widget.
              Paste or type any code snippet and analyze it instantly.
            </p>
          </div>

          {/* Alternative: Copy */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Or copy the bookmarklet manually
            </h2>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted rounded-lg p-3 font-mono text-muted-foreground break-all select-all overflow-auto max-h-24">
                {bookmarkletCode}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Create a new bookmark, paste this as the URL, and name it "CodeLens AI".
            </p>
          </div>

          {/* Direct link */}
          <div className="text-center text-sm text-muted-foreground">
            Or open the widget directly:{" "}
            <a
              href={`${origin}/widget`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {origin}/widget
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
