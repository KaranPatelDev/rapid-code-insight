import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function UsageIndicator() {
  const { user } = useAuth();
  const { dailyLimit, plan } = useUserPlan();
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

  // Unlimited for team plan
  const isUnlimited = dailyLimit === 0;
  const remaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - count);
  const pct = isUnlimited ? 0 : (count / dailyLimit) * 100;
  const isLow = !isUnlimited && remaining <= 2;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground cursor-default">
          <Zap className={`h-3.5 w-3.5 ${isLow ? "text-destructive" : "text-primary"}`} />
          <div className="flex items-center gap-1.5">
            <span className="font-medium tabular-nums">
              {isUnlimited ? `${count} used` : `${count}/${dailyLimit}`}
            </span>
            {!isUnlimited && (
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
                <div
                  className={`h-full rounded-full transition-all ${isLow ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            )}
            <span className="text-[10px] uppercase font-semibold text-primary/70">{plan}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{isUnlimited ? `${count} analyses used today (unlimited)` : `${remaining} analyses remaining today`}</p>
      </TooltipContent>
    </Tooltip>
  );
}
