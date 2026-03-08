import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

const proFeatures = [
  "50 analyses per day",
  "PR Review & Multi-Repo",
  "Analysis History",
  "Follow-up Questions",
  "Priority Processing",
];

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{feature}</span> is available on the Pro plan and above.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-3xl font-bold">$19</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <ul className="space-y-2">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full gap-2" asChild>
            <Link to="/#pricing">
              <Zap className="h-4 w-4" /> View Plans & Upgrade
            </Link>
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
