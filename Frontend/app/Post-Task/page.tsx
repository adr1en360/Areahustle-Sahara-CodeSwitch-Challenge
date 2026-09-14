"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { naira } from "@/lib/format";
import { Mic, Lock, MapPin, Tag, Wallet, Sparkles, Check, Keyboard } from "lucide-react";
import { toast } from "sonner";

type Phase = "idle" | "recording" | "processing" | "result" | "locked";

export default function PostTask() {
  const { isLoggedIn } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [manualMode, setManualMode] = useState(false);
  const [voiceResult, setVoiceResult] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = "/";
    }
  }, [isLoggedIn]);

  const createTask = async (data: any) => {
    await api.createTask(data);
    toast.success("Job Posted!");
    window.location.href = "/Customer-Dashboard";
  };

  const startRecording = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setPhase("processing");
        const mimeType = mr.mimeType || "audio/webm";
        const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "wav";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        const formData = new FormData();
        formData.append("file", audioBlob, `voice.${ext}`);

        try {
          const result = (await api.voiceToIntentUpload(formData)) as any;
          const entities = result?.entities ?? result ?? {};
          setVoiceResult(entities);

          setTitle(entities.category || "");
          setDescription(entities.description || "");
          setBudget(entities.budget ? String(entities.budget) : "");
          setArea(entities.neighbourhood || "");

          toast.success("Speech structured! Review fields below.");
          setPhase("idle");
          setManualMode(true);
        } catch (err: any) {
          toast.error(err.message || "Failed to parse intent. Please try typing manually.");
          setPhase("idle");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mr.start();
      setPhase("recording");
    } catch (err) {
      toast.error("Microphone access denied or not supported.");
      setPhase("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicClick = () => {
    if (phase === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({ title, description, budget: Number(budget), neighbourhood: area, category: "General" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-widest text-voice font-semibold mb-3">Task Terminal</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Speak your task.</h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto">Aethex listens. Gemini structures. Lock escrow when it looks right.</p>
      </div>

      <div className="rounded-3xl bg-card border shadow-elevated p-8 sm:p-12">
        {manualMode ? (
          <form onSubmit={handleManualSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Fix my generator"
                className="mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Explain the job so the hustler understands it better..."
                rows={4}
                className="mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget (₦)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  placeholder="e.g. 5000"
                  className="mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  placeholder="e.g. Lekki Phase 1"
                  className="mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 rounded-full border py-3.5 text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-semibold hover:opacity-90 transition"
              >
                Post Job
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setManualMode(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <Keyboard className="h-4 w-4" /> Type it manually
              </button>
            </div>
            <div className="flex flex-col items-center text-center">
              <button
                onClick={handleMicClick}
                disabled={phase === "processing" || phase === "locked"}
                className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-voice text-voice-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition disabled:opacity-90"
              >
                <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
                {(phase === "recording" || phase === "processing") && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-voice animate-voice-pulse" />
                    <span className="absolute inset-0 rounded-full bg-voice animate-voice-pulse" style={{ animationDelay: "0.6s" }} />
                  </>
                )}
              </button>
              <div className="mt-6 font-display text-xl font-semibold">
                {phase === "idle" && "Speak Task"}
                {phase === "recording" && "Listening…"}
                {phase === "processing" && "Parsing intent…"}
                {phase === "result" && "Here's your task"}
                {phase === "locked" && "Escrow locked"}
              </div>
              <div className="text-sm text-muted-foreground mt-1 max-w-sm">
                {phase === "idle" && 'Try: "I need someone to service my generator in Lekki for ₦8,000".'}
                {phase === "recording" && "Aethex Speech-to-Text active"}
                {phase === "processing" && "Gemini structuring fields"}
                {phase === "result" && "Review and lock escrow to publish to nearby hustlers."}
                {phase === "locked" && "Hustlers in your area have been notified."}
              </div>
            </div>

            {/* Waveform */}
            {(phase === "recording" || phase === "processing") && (
              <div className="mt-10 flex items-end justify-center gap-1.5 h-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-voice/70 animate-wave"
                    style={{
                      height: `${10 + Math.abs(Math.sin(i / 2.5)) * 80}%`,
                      animationDelay: `${i * 40}ms`,
                      animationDuration: `${0.7 + (i % 4) * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {(phase === "result" || phase === "locked") && (
              <div className="mt-10 animate-fade-up">
                <div className="rounded-2xl border bg-muted/40 p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-voice" /> Structured by Gemini
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field icon={Tag} label="Category" value={voiceResult?.category || "Repairs"} />
                    <Field icon={Wallet} label="Budget" value={naira(voiceResult?.budget || 8000)} />
                    <Field icon={MapPin} label="Location" value={voiceResult?.neighbourhood || "Lekki Phase 1"} />
                  </div>
                  <div className="mt-5 rounded-xl bg-card border p-4 text-sm text-muted-foreground italic">
                    "
                    {voiceResult?.description ||
                      "I need someone to come service my Tiger generator today in Lekki Phase 1, budget around eight thousand naira."}
                    "
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setPhase("locked");
                    await createTask({
                      title: voiceResult?.category || "Generator Servicing",
                      description:
                        voiceResult?.description ||
                        "I need someone to come service my Tiger generator today in Lekki Phase 1, budget around eight thousand naira.",
                      budget: voiceResult?.budget || 8000,
                      neighbourhood: voiceResult?.neighbourhood || "Lekki Phase 1",
                      category: voiceResult?.category || "Repairs",
                    });
                  }}
                  disabled={phase === "locked"}
                  className="mt-6 w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-90"
                >
                  {phase === "locked" ? (
                    <>
                      <Check className="h-4 w-4" /> Locked · Releasing to feed
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" /> Lock Escrow to Confirm
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Mic; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display font-semibold">{value}</div>
    </div>
  );
}
