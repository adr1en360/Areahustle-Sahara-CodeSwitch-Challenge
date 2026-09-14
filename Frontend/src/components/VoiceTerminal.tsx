"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Mic, Sparkles, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Phase = "listening" | "parsing" | "ready";

const SAMPLE = {
  text: "I need someone to run an errand to Shoprite Lekki and drop a package off.",
  cat: "Errands",
  budget: 2000,
  area: "Lekki Phase 1",
  title: "Errand - Shoprite Lekki drop-off",
};

export function VoiceTerminal() {
  const { voiceOpen, setVoiceOpen, isLoggedIn, addJob } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("listening");

  useEffect(() => {
    if (!voiceOpen) return;
    setPhase("listening");
    const t1 = setTimeout(() => setPhase("parsing"), 2400);
    const t2 = setTimeout(() => setPhase("ready"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [voiceOpen]);

  useEffect(() => {
    if (!voiceOpen || phase !== "ready") return;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(
      "Your task is ready. I have structured the request for nearby hustlers in your area."
    );
    utterance.lang = "en-NG";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voiceOpen, phase]);

  const close = () => setVoiceOpen(false);

  const confirm = () => {
    addJob({
      id: Date.now(),
      title: SAMPLE.title,
      area: SAMPLE.area,
      dist: "0.5 km",
      budget: SAMPLE.budget,
      rating: 4.8,
      customer: "You · Voice posted",
      cat: SAMPLE.cat,
      posted: "just now",
      isNew: true,
    });
    toast.success("Task posted to your area", {
      description: `${SAMPLE.title} · ₦${SAMPLE.budget.toLocaleString("en-NG")}`,
    });
    close();
    router.push("/Jobs");
  };

  return (
    <>
      {/* Floating FAB */}
      {isLoggedIn && !voiceOpen && (
        <button
          onClick={() => setVoiceOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 rounded-full bg-voice text-voice-foreground pl-4 pr-5 py-3.5 shadow-elevated hover:scale-105 transition"
          aria-label="Open voice task terminal"
        >
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-voice-foreground/20 animate-voice-pulse" />
            <Mic className="h-4 w-4 relative" />
          </span>
          <span className="text-xs font-semibold">Speak Task</span>
        </button>
      )}

      {voiceOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-up">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={close} />
          <div className="relative w-full max-w-lg rounded-3xl bg-card shadow-elevated p-8 animate-scale-in">
            <button
              onClick={close}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-voice font-semibold mb-2">
              <Sparkles className="h-3 w-3" /> Aethex · Task Terminal
            </div>
            <h3 className="font-display text-2xl font-bold mb-1">
              {phase === "listening" && "Listening…"}
              {phase === "parsing" && "Parsing with Gemini…"}
              {phase === "ready" && "Here's your structured task"}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              {phase === "ready" ? "Confirm to publish to hustlers in your area." : "Speak naturally in English, French or Arabic."}
            </p>

            {phase !== "ready" && (
              <div className="rounded-2xl bg-muted/60 p-6 flex flex-col items-center">
                <div className="relative h-20 w-20 rounded-full bg-voice flex items-center justify-center">
                  <Mic className="h-7 w-7 text-voice-foreground" />
                  <span className="absolute inset-0 rounded-full bg-voice animate-voice-pulse" />
                </div>
                <div className="mt-5 flex items-end gap-1 h-12 w-full">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-voice/70 animate-wave"
                      style={{
                        height: `${20 + Math.sin(i / 2) * 40 + (i % 3) * 8}%`,
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  ))}
                </div>
                {phase === "parsing" && (
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Structuring intent…
                  </div>
                )}
              </div>
            )}

            {phase === "ready" && (
              <div className="space-y-4 animate-fade-up">
                <div className="rounded-2xl bg-muted/60 p-4 text-sm italic text-muted-foreground">"{SAMPLE.text}"</div>
                <div className="rounded-2xl border bg-card p-5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Parsed by Gemini</div>
                  <div className="font-display text-lg font-bold mb-3">{SAMPLE.title}</div>
                  <div className="flex flex-wrap gap-2">
                    <Chip label="Category" value={SAMPLE.cat} />
                    <Chip label="Budget" value={`₦${SAMPLE.budget.toLocaleString("en-NG")}`} />
                    <Chip label="Location" value={SAMPLE.area} />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={close} className="flex-1 rounded-2xl border py-3 text-sm font-semibold hover:bg-muted transition">
                    Re-record
                  </button>
                  <button
                    onClick={confirm}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-95 transition"
                  >
                    <Check className="h-4 w-4" /> Confirm & Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
