"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { naira } from "@/lib/format";
import heroHustler from "@/assets/hero-hustler.jpg";
import estate from "@/assets/estate.jpg";
import h1 from "@/assets/hustler-1.jpg";
import h2 from "@/assets/hustler-2.jpg";
import h3 from "@/assets/hustler-3.jpg";
import { Mic, ArrowRight, Shield, Wallet, Star, Lock, Check } from "lucide-react";

export default function LandingClient() {
  const { isLoggedIn } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState<"customer" | "hustler">("customer");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const openAuth = (r: "customer" | "hustler", m: "login" | "register" = "register") => {
    setAuthRole(r);
    setAuthMode(m);
    setAuthOpen(true);
  };

  return (
    <div className="bg-[#F9F9F8] min-h-screen font-sans text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-32 h-120 w-[480px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-105 w-[420px] rounded-full bg-voice/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground mb-6 shadow-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Now matching 2,400+ hustlers across Lagos
              </div>
              <h1 className="font-display text-[44px] sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
                Your Area. <br className="hidden sm:block" />
                Your Hustle. <span className="text-primary">Your Trust.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                The first gig marketplace that turns your everyday tasks into a verified financial passport - voice-first, escrow-secured, locally
                trusted.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={isLoggedIn ? "/Post-Task" : "/"}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    if (!isLoggedIn) {
                      e.preventDefault();
                      openAuth("customer", "register");
                    }
                  }}
                  className="group inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition shadow-soft"
                >
                  <Mic className="h-4 w-4" />
                  Post a Task (Voice Enabled)
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  onClick={() => openAuth("hustler", "register")}
                  className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-full border bg-card px-5 py-3.5 text-sm font-semibold hover:bg-muted transition"
                >
                  Join as a Hustler
                </button>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[h1, h2, h3].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt="Hustler Avatar"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full ring-2 ring-background object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 text-foreground font-semibold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="ml-1">4.9</span>
                  </div>
                  Trusted by 12,000+ households across Lekki, Yaba & Ikeja
                </div>
              </div>
            </div>

            {/* Bento mockup */}
            <div className="lg:col-span-5 animate-scale-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 rounded-3xl bg-card shadow-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-2xl bg-voice/10 flex items-center justify-center">
                        <Mic className="h-4 w-4 text-voice" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Aethex · Listening</div>
                        <div className="text-sm font-semibold">&quot;Service my generator…&quot;</div>
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-voice font-semibold">Live</div>
                  </div>
                  <div className="flex items-end gap-1 h-12 mb-4">
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
                  <div className="rounded-2xl bg-muted p-4">
                    <div className="text-xs text-muted-foreground mb-1">Parsed by Gemini</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-card px-2.5 py-1 border">Generator Servicing</span>
                      <span className="rounded-full bg-card px-2.5 py-1 border">₦8,000</span>
                      <span className="rounded-full bg-card px-2.5 py-1 border">Lekki Phase 1</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-card shadow-soft p-5">
                  <div className="text-xs text-muted-foreground mb-2">Trust Score</div>
                  <TrustDial value={820} />
                </div>
                <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="text-xs/relaxed opacity-70">Escrow Locked</div>
                    <div className="font-display text-3xl font-bold mt-1">{naira(8000)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs opacity-80">
                    <Lock className="h-3 w-3" /> Auto-release on completion
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS / TRUST STRIP */}
      <section className="border-y bg-card/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground text-center">
          <span>Powered by Aethex Voice</span>
          <span className="hidden sm:inline">•</span>
          <span>Gemini Intent Parsing</span>
          <span className="hidden sm:inline">•</span>
          <span>Paystack Escrow</span>
          <span className="hidden sm:inline">•</span>
          <span>Flutterwave Sweeps</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">How it works</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">From a spoken request to a paid hustler - in minutes.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Mic,
              t: "Speak Your Task",
              d: "Tap once and describe what you need. Aethex transcribes; Gemini structures the brief.",
              c: "voice",
            },
            { icon: Shield, t: "Lock Escrow", d: "Funds are held safely until the job is verified complete. No upfront risk.", c: "primary" },
            { icon: Wallet, t: "Build Your Passport", d: "Every completed job grows your Trust Score and unlocks fairer micro-loans.", c: "success" },
          ].map((s, i) => (
            <div key={i} className="group rounded-3xl bg-card p-7 shadow-soft hover:shadow-elevated transition">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-5 ${
                  s.c === "voice" ? "bg-voice/10 text-voice" : s.c === "primary" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">0{i + 1}</div>
              <h3 className="font-display text-xl font-bold mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EDITORIAL SPLIT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-0 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative rounded-[2rem] overflow-hidden shadow-elevated aspect-[1/1] sm:aspect-[4/3] lg:aspect-[1/1]">
            <Image
              src={heroHustler}
              alt="Professional Nigerian artisan"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              placeholder="blur"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl glass p-4">
              <div className="flex items-center gap-3">
                <Image src={h3} width={40} height={40} className="rounded-full object-cover" alt="Tunde A." />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Tunde A. · Generator Tech</div>
                  <div className="text-xs text-muted-foreground">Trust Score 880 · 142 jobs</div>
                </div>
                <span className="rounded-full bg-success/15 text-success text-xs font-semibold px-2.5 py-1">Verified</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Built for the informal economy</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-5">A passport that travels with the work.</h2>
            <p className="text-muted-foreground mb-6">
              Bank statements ignore the hustle. AreaHustle counts every completed job, every five-star review, every on-time delivery - and turns it
              into a credit footprint that lenders trust.
            </p>
            <ul className="space-y-3">
              {[
                "Hyper-local matching by neighborhood, not rigid geofences.",
                "Voice-first in English, French and Arabic.",
                "Automated micro-loan sweeps direct from completed jobs.",
                "Trust Score recalculated in real-time.",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-sm">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* STATS / CITY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-[2rem] overflow-hidden shadow-elevated">
          <Image
            src={estate}
            alt="Modern Lagos estate"
            fill
            sizes="(min-width: 1280px) 1216px, calc(100vw - 2rem)"
            className="object-cover"
            placeholder="blur"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/20" />
          <div className="relative grid md:grid-cols-4 gap-6 p-8 sm:p-12 text-primary-foreground">
            <div className="md:col-span-2">
              <h3 className="font-display text-4xl font-bold leading-tight">A new financial fabric, woven one job at a time.</h3>
            </div>
            {[
              { v: "₦1.2B+", l: "Escrowed since launch" },
              { v: "12,000", l: "Active hustlers" },
              { v: "98%", l: "On-time releases" },
              { v: "2.4M", l: "Voice tasks parsed" },
            ].map((s) => (
              <div key={s.l} className="text-center md:text-left">
                <div className="font-display text-3xl font-bold">{s.v}</div>
                <div className="text-sm opacity-80 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-[2rem] bg-card shadow-elevated p-10 sm:p-16 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4 max-w-2xl mx-auto">
            Ready to turn your hustle into history?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Join the marketplace that pays you fairly today - and finances you tomorrow.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openAuth("customer", "register")}
              className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition"
            >
              Post your first task
            </button>
            <button
              onClick={() => openAuth("hustler", "register")}
              className="rounded-full border bg-card px-6 py-3.5 text-sm font-semibold hover:bg-muted transition"
            >
              Become a Hustler
            </button>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialRole={authRole} initialMode={authMode} />
    </div>
  );
}

function TrustDial({ value }: { value: number }) {
  const max = 1000;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  const pct = shown / max;
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct * 0.75);
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-[135deg]">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * 0.25}
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary transition-all duration-[1500ms] ease-out"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-bold tabular-nums">{shown}</div>
        <div className="text-[10px] text-muted-foreground">/ 1000</div>
      </div>
    </div>
  );
}
