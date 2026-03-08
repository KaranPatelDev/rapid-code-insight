import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface FollowUpInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export function FollowUpInput({ onSubmit, isLoading }: FollowUpInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (!question.trim()) return;
    onSubmit(question);
    setQuestion("");
  };

  return (
    <div className="mt-4 flex gap-2">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a follow-up question about this code..."
        className="bg-card border-border/50"
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        disabled={isLoading}
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !question.trim()}
        size="icon"
        className="shrink-0 bg-primary hover:bg-primary/90"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
}
