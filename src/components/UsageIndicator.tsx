import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DAILY_LIMIT = 50;

export function UsageIndicator() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("daily_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle()
      .then(({ data }) => setCount(data?.analysis_count ?? 0));
  }, [user]);

  if (count === null) return null;

  const remaining = Math.max(0, DAILY_LIMIT - count);
  const pct = (count / DAILY_LIMIT) * 100;
  const isLow = remaining <= 10;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground cursor-default">
          <Zap className={`h-3.5 w-3.5 ${isLow ? "text-destructive" : "text-primary"}`} />
          <div className="flex items-center gap-1.5">
            <span className="font-medium tabular-nums">
              {count}/{DAILY_LIMIT}
            </span>
            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full transition-all ${isLow ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{remaining} analyses remaining today</p>
      </TooltipContent>
    </Tooltip>
  );
}
