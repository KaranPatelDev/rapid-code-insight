export interface HistoryEntry {
  id: string;
  title: string;
  code: string;
  question?: string;
  output: string;
  timestamp: number;
  source: "paste" | "github" | "file" | "example";
}

const STORAGE_KEY = "codelens-history";
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const history = getHistory();
  history.unshift(newEntry);
  if (history.length > MAX_ENTRIES) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newEntry;
}

export function deleteFromHistory(id: string) {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateTitle(code: string, question?: string): string {
  if (question) return question.slice(0, 60);
  // Try to extract a meaningful title from the code
  const lines = code.split("\n").filter((l) => l.trim());
  for (const line of lines.slice(0, 10)) {
    if (line.includes("class ")) {
      const match = line.match(/class\s+(\w+)/);
      if (match) return match[1];
    }
    if (line.includes("function ")) {
      const match = line.match(/function\s+(\w+)/);
      if (match) return match[1];
    }
    if (line.includes("export default")) return "Default Export";
    if (line.startsWith("CREATE TABLE")) {
      const match = line.match(/CREATE TABLE\s+\w*\.?(\w+)/i);
      if (match) return `Schema: ${match[1]}`;
    }
  }
  return `Analysis ${new Date().toLocaleDateString()}`;
}
