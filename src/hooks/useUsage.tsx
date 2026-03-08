import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useUserPlan";

export function useUsage() {
  const { user } = useAuth();
  const { dailyLimit, plan } = useUserPlan();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();
    setCount(data?.analysis_count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  const isUnlimited = dailyLimit === 0;
  const remaining = isUnlimited ? Infinity : Math.max(0, dailyLimit - count);
  const canAnalyze = isUnlimited || remaining > 0;

  return { count, dailyLimit, remaining, isUnlimited, canAnalyze, plan, loading, refresh: fetchCount };
}
