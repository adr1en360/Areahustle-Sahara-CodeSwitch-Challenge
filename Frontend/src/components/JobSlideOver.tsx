"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type PostedJob } from "@/lib/auth-context";
import { naira } from "@/lib/format";
import {
  X,
  MapPin,
  Star,
  Clock,
  Lock,
  Shield,
  Loader2,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type Phase = "review" | "binding" | "locked";

export function JobSlideOver({
  job,
  open,
  onClose,
}: {
  job: PostedJob | null;
  open: boolean;
  onClose: () => void;
}) {
  const { triggerPayout } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("review");

  useEffect(() => {
    if (open) setPhase("review");
  }, [open, job?.id]);

  if (!open || !job) return null;

  const accept = () => {
    setPhase("binding");
    setTimeout(() => setPhase("locked"), 1000);
  };

  const simulate = () => {
    triggerPayout({
      gross: job.budget,
      title: job.title,
      customer: job.customer,
    });
    toast.success("Mutual completion confirmed", {
      description: "Routing to your Financial Passport…",
    });
    onClose();
    setTimeout(() => router.push("/Passport"), 80);
  };

  const sweep = Math.round(job.budget * 0.2);
  const net = job.budget - sweep;

  return (
    <div className="fixed inset-0 z-50 animate-fade-up">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-card shadow-elevated overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card/80 backdrop-blur px-6 py-4 border-b">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Job Details
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">
            {job.cat}
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight">{job.title}</h2>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.area} · {job.dist} away
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Posted {job.posted}
            </span>
          </div>

          {/* Customer card */}
          <div className="mt-6 rounded-2xl border bg-muted/30 p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {job.customer.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{job.customer}</div>
                <div className="text-xs text-muted-foreground">{job.area}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-current" />
                {job.rating}
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="mt-5 rounded-2xl bg-primary text-primary-foreground p-5">
            <div className="text-xs opacity-70 uppercase tracking-widest">Job Budget</div>
            <div className="font-display text-4xl font-bold mt-1">{naira(job.budget)}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs opacity-80">
              <Shield className="h-3.5 w-3.5" /> Held in Paystack escrow on accept
            </div>
          </div>

          {/* Sweep preview */}
          <div className="mt-5 rounded-2xl border p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
              Estimated payout breakdown
            </div>
            <Row label="Job completion" value={`+${naira(job.budget)}`} />
            <Row label="Escrow sweep · Loan (20%)" value={`-${naira(sweep)}`} muted />
            <div className="border-t my-2" />
            <Row label="To your wallet" value={`+${naira(net)}`} accent />
          </div>

          <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
            By accepting, funds are locked in escrow. They release automatically once both you
            and the customer confirm completion.
          </p>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-card/90 backdrop-blur border-t px-6 py-4">
          {phase === "review" && (
            <button
              onClick={accept}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition"
            >
              <Lock className="h-4 w-4" /> Accept & Bind Escrow
            </button>
          )}
          {phase === "binding" && (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/70 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Binding escrow…
            </button>
          )}
          {phase === "locked" && (
            <div className="space-y-3 animate-fade-up">
              <div className="rounded-2xl bg-success/10 border border-success/20 p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success text-success-foreground flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-success">Escrow Secured via Paystack</div>
                  <div className="text-xs text-muted-foreground">Funds are locked. You're cleared to start.</div>
                </div>
                <Check className="h-4 w-4 text-success" />
              </div>
              <button
                onClick={simulate}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 py-3.5 text-sm font-semibold text-primary hover:bg-primary/5 transition"
              >
                <Sparkles className="h-4 w-4" /> Simulate Mutual Completion
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                Demo fast-forward
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-display font-bold tabular-nums ${
          accent ? "text-success" : muted ? "text-destructive/80" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
