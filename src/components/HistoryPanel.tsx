import { useState, useEffect, useCallback } from "react";
import { HistoryEntry, getHistory, deleteFromHistory, clearHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { History, Trash2, Clock, Github, Code2, FileText, Sparkles, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface HistoryPanelProps {
  onSelect: (entry: HistoryEntry) => void;
}

const sourceIcons = {
  paste: Code2,
  github: Github,
  file: FileText,
  example: Sparkles,
};

const modeLabels: Record<string, string> = {
  architecture: "Architecture",
  security: "Security",
  performance: "Performance",
  best_practices: "Best Practices",
};

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getHistory();
    setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFromHistory(id);
    refresh();
  };

  const handleClear = async () => {
    await clearHistory();
    refresh();
  };

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    setOpen(false);
  };

  const filtered = search.trim()
    ? history.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.question?.toLowerCase().includes(search.toLowerCase())
      )
    : history;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Analysis History
            </SheetTitle>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive">
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        {history.length > 3 && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search analyses..."
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50"
            />
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-140px)] mt-4 -mx-2">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{search ? "No matching analyses" : "No analyses yet"}</p>
              <p className="text-xs mt-1">
                {search ? "Try a different search term" : "Your analysis history will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {filtered.map((entry) => {
                const SourceIcon = sourceIcons[entry.source] || Code2;
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelect(entry)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <SourceIcon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{entry.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {modeLabels[entry.mode || "architecture"] || entry.mode}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(entry.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
