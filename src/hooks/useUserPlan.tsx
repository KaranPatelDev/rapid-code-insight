import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanTier = "free" | "pro" | "team";

interface PlanFeatures {
  plan: PlanTier;
  dailyLimit: number; // 0 = unlimited
  hasPRReview: boolean;
  hasMultiRepo: boolean;
  hasHistory: boolean;
  hasFollowUp: boolean;
  hasPriorityProcessing: boolean;
  hasTeamWorkspaces: boolean;
  hasSharedHistory: boolean;
  hasPrioritySupport: boolean;
  hasCustomIntegrations: boolean;
  loading: boolean;
}

const PLAN_CONFIG: Record<PlanTier, Omit<PlanFeatures, "plan" | "loading">> = {
  free: {
    dailyLimit: 5,
    hasPRReview: false,
    hasMultiRepo: false,
    hasHistory: false,
    hasFollowUp: false,
    hasPriorityProcessing: false,
    hasTeamWorkspaces: false,
    hasSharedHistory: false,
    hasPrioritySupport: false,
    hasCustomIntegrations: false,
  },
  pro: {
    dailyLimit: 50,
    hasPRReview: true,
    hasMultiRepo: true,
    hasHistory: true,
    hasFollowUp: true,
    hasPriorityProcessing: true,
    hasTeamWorkspaces: false,
    hasSharedHistory: false,
    hasPrioritySupport: false,
    hasCustomIntegrations: false,
  },
  team: {
    dailyLimit: 0, // unlimited
    hasPRReview: true,
    hasMultiRepo: true,
    hasHistory: true,
    hasFollowUp: true,
    hasPriorityProcessing: true,
    hasTeamWorkspaces: true,
    hasSharedHistory: true,
    hasPrioritySupport: true,
    hasCustomIntegrations: true,
  },
};

export function useUserPlan(): PlanFeatures {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPlan((data?.plan as PlanTier) ?? "free");
        setLoading(false);
      });
  }, [user]);

  return {
    plan,
    loading,
    ...PLAN_CONFIG[plan],
  };
}
