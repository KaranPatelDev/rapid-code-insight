import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  code: string;
  question?: string;
  output: string;
  source: string;
}

export function ShareButton({ title, code, question, output, source }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const { data, error } = await supabase
        .from("shared_analyses")
        .insert({ title, code, question, output, source })
        .select("short_id")
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/s/${data.short_id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setShared(false), 3000);
    } catch (e: any) {
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      disabled={sharing}
      className="text-muted-foreground hover:text-foreground"
    >
      {sharing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : shared ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      <span className="ml-1 text-xs">{shared ? "Copied!" : "Share"}</span>
    </Button>
  );
}
