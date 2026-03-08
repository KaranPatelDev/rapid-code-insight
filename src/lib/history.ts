import { supabase } from "@/integrations/supabase/client";

export interface HistoryEntry {
  id: string;
  title: string;
  code: string;
  question?: string;
  output: string;
  timestamp: number;
  source: "paste" | "github" | "file" | "example";
  mode?: string;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    code: row.code,
    question: row.question ?? undefined,
    output: row.output,
    timestamp: new Date(row.created_at).getTime(),
    source: row.source as HistoryEntry["source"],
    mode: row.mode,
  }));
}

export async function addToHistory(
  entry: Omit<HistoryEntry, "id" | "timestamp">,
  userId: string
): Promise<HistoryEntry | null> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      title: entry.title,
      code: entry.code,
      question: entry.question ?? null,
      output: entry.output,
      source: entry.source,
      mode: entry.mode ?? "architecture",
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    code: data.code,
    question: data.question ?? undefined,
    output: data.output,
    timestamp: new Date(data.created_at).getTime(),
    source: data.source as HistoryEntry["source"],
    mode: data.mode,
  };
}

export async function deleteFromHistory(id: string) {
  await supabase.from("analyses").delete().eq("id", id);
}

export async function clearHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("analyses").delete().eq("user_id", user.id);
  }
}

export function generateTitle(code: string, question?: string): string {
  if (question) return question.slice(0, 60);
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
