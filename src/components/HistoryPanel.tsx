import { useState } from "react";
import { HistoryEntry, getHistory, deleteFromHistory, clearHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, Clock, Github, Code2, FileText, Sparkles, X } from "lucide-react";
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

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());
  const [open, setOpen] = useState(false);

  const refresh = () => setHistory(getHistory());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
    refresh();
  };

  const handleClear = () => {
    clearHistory();
    refresh();
  };

  const handleSelect = (entry: HistoryEntry) => {
    onSelect(entry);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) refresh(); }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
          <History className="h-4 w-4" />
          {history.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              {history.length > 9 ? "9+" : history.length}
            </span>
          )}
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

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 -mx-2">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No analyses yet</p>
              <p className="text-xs mt-1">Your analysis history will appear here</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {history.map((entry) => {
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
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.timestamp)}
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
