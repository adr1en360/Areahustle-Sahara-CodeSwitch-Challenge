"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { naira } from "@/lib/format";
import { ShieldCheck, ArrowUpRight, ArrowDownRight, CreditCard, Mic, Share2, CheckCircle, Clock, TrendingUp, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

function PassportTrustDial({ value }: { value: number }) {
  const max = 1000;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 300);
    return () => clearTimeout(t);
  }, [value]);
  const pct = shown / max;
  const r = 50;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct * 0.75); // 270 degree circle
  return (
    <div className="relative flex items-center justify-center h-36 w-36 sm:h-40 sm:w-40 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-[135deg]">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#E5E7EB"
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
          stroke="#0D3B2E"
          className="transition-all duration-[1500ms] ease-out"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl sm:text-4xl font-bold tabular-nums text-[#0D3B2E]">{shown}</div>
        <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-widest">/ 1000</div>
      </div>
    </div>
  );
}

export default function PassportPage() {
  const { isLoggedIn, userRole, user } = useAuth();
  const [voiceExpanded, setVoiceExpanded] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [passport, setPassport] = useState<any>(null);
  const [proofCard, setProofCard] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn || userRole !== "hustler") {
      window.location.href = "/";
      return;
    }

    Promise.all([api.getPassport(), api.getProofCard(), api.getTransactions()]).then(([passportData, proofData, txnData]) => {
      setPassport(passportData);
      setProofCard(proofData);
      setTxns(txnData);
    });
  }, [isLoggedIn, userRole]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://areahustle.com/p/tunde-820");
    toast.success("Passport link copied! Share it directly with lenders via WhatsApp.");
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] font-sans pb-0">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-40 bg-[#F9F9F8]/80 backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0D3B2E]">Financial Passport</h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Wallet Balance</div>
              <div className="font-display font-bold text-base sm:text-lg text-[#0D3B2E]">{naira(user?.wallet_balance || 0)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold shadow-soft">EA</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* The Trust Score Bento Box */}
        <div className="rounded-[2rem] bg-white border border-gray-100 shadow-elevated p-6 sm:p-10 mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Left: Dial & Copy Link */}
            <div className="flex flex-col items-center text-center">
              <div className="text-xs uppercase tracking-widest text-[#0D3B2E] font-semibold mb-2">Verified Trust Score</div>
              <PassportTrustDial value={user?.trust_score || passport?.trust_score || 0} />
              <button
                onClick={handleCopyLink}
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#0D3B2E] text-white px-6 py-3 text-sm font-semibold hover:bg-[#0D3B2E]/90 transition shadow-soft w-full"
              >
                <Share2 className="h-4 w-4" /> Copy Public Link
              </button>
              <button
                onClick={() => setProofOpen(true)}
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-[#0D3B2E] px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition shadow-soft w-full"
              >
                <CreditCard className="h-4 w-4" /> Generate Proof Card
              </button>
            </div>

            {/* Right: Data Breakdown */}
            <div className="flex-1 w-full bg-[#F9F9F8] rounded-3xl p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-[#0D3B2E] mb-5 uppercase tracking-wider">Score Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Job Completion Rate</div>
                  <div className="font-display text-2xl font-bold text-[#10B981]">
                    {passport?.job_completion_rate || 0}%{" "}
                    <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-full ml-1 align-middle uppercase">
                      High Weight
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">On-Time Arrival</div>
                  <div className="font-display text-xl font-bold text-[#0D3B2E]">{passport?.on_time_arrival || 0}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Repeat Hire Ratio</div>
                  <div className="font-display text-xl font-bold text-[#0D3B2E]">{passport?.repeat_hire_ratio || 0}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Dispute Rate</div>
                  <div className="font-display text-xl font-bold text-[#0D3B2E]">{passport?.dispute_rate || 0}%</div>
                </div>
                <div className="sm:col-span-2 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Avg. Response Time
                    </span>
                    <span className="font-display text-lg font-bold text-[#0D3B2E]">&lt; 5 mins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Factors & AI Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-soft">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[#0D3B2E] mb-5">
              <TrendingUp className="h-5 w-5 text-primary" /> Top factors affecting your score
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <div className="font-semibold text-sm">Perfect Completion Rate</div>
                  <div className="text-xs text-muted-foreground">You have finished 100% of your accepted jobs.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <div className="font-semibold text-sm">Lightning Fast Responses</div>
                  <div className="text-xs text-muted-foreground">Your response time is under 5 minutes.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                <div>
                  <div className="font-semibold text-sm">Zero Disputes</div>
                  <div className="text-xs text-muted-foreground">Customers are highly satisfied with your work.</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#4F46E5]/5 rounded-[2rem] p-6 sm:p-8 border border-[#4F46E5]/10 shadow-soft relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <Mic className="h-32 w-32" />
            </div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[#4F46E5] mb-5 relative z-10">
              <Sparkles className="h-5 w-5" /> AI Improvement Tips
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-white shadow-sm">
                <div className="font-semibold text-sm text-[#4F46E5] mb-1">Pick up more weekend gigs</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Your availability on weekends is low. Hustlers active on weekends see a 15% boost in trust scores on average.
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-white shadow-sm">
                <div className="font-semibold text-sm text-[#4F46E5] mb-1">Upload visual proof</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Jobs marked with 'Before & After' photos decrease dispute likelihood and increase customer rating.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Transaction Ledger */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h2 className="font-display text-xl font-bold mb-4 text-[#0D3B2E]">Recent Payouts</h2>
          <div className="rounded-[2rem] bg-white border border-gray-100 shadow-soft p-2 sm:p-4">
            <div className="space-y-2">
              {txns.map((t: any, idx: number) => {
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-6 rounded-3xl hover:bg-[#F9F9F8] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${t.amount > 0 ? "bg-[#10B981]/10 text-[#10B981]" : "bg-gray-100 text-gray-500"}`}
                      >
                        {t.amount > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#0D3B2E]">{t.desc}</div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2 mt-1">
                          {t.location && <span>[{t.location}]</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {t.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`font-display text-xl font-bold self-end sm:self-center ${t.amount > 0 ? "text-[#10B981]" : "text-gray-900"}`}>
                      {t.amount > 0 ? "+" : ""}
                      {naira(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Aethex Voice-Assisted Financial Passport FAB */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end">
        {voiceExpanded && (
          <div className="mb-4 w-72 sm:w-80 bg-white rounded-3xl shadow-elevated border border-gray-100 p-6 animate-fade-up origin-bottom-right">
            <div className="flex justify-between items-start mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] flex items-center gap-1.5">
                <Mic className="h-3 w-3 animate-pulse" /> Aethex Listening
              </div>
              <button onClick={() => setVoiceExpanded(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-lg font-display font-semibold text-[#0D3B2E] leading-snug">"What is my Trust Score?"</p>

            {/* Simulated Audio Waveform */}
            <div className="flex items-center justify-center gap-1 h-12 mt-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#4F46E5] rounded-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                    height: `${20 + Math.random() * 80}%`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {!voiceExpanded && (
          <button
            onClick={() => setVoiceExpanded(true)}
            className="group flex items-center gap-3 bg-[#4F46E5] text-white rounded-full p-4 pr-6 shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 hover:bg-[#4338ca] transition-all duration-300 animate-fade-up"
          >
            <div className="relative">
              <Mic className="h-6 w-6 relative z-10" />
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "3s" }}></span>
            </div>
            <span className="font-semibold text-sm max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-500 ease-in-out whitespace-nowrap">
              Ask Aethex...
            </span>
          </button>
        )}
      </div>

      {/* Holographic Proof Card Modal */}
      {proofOpen && proofCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-[#0D3B2E]/40 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-gradient-to-br from-[#0D3B2E] via-[#164e3c] to-[#0A261E] border-2 border-[#10B981]/40 shadow-[0_20px_50px_rgba(16,185,129,0.3)] p-8 overflow-hidden text-white">
            {/* Ambient holographic glow accents */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 rounded-full bg-[#10B981]/20 blur-[60px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-[#4F46E5]/20 blur-[60px]" />

            <button onClick={() => setProofOpen(false)} className="absolute right-6 top-6 text-[#10B981]/70 hover:text-white transition">
              <X className="h-6 w-6" />
            </button>

            <div className="flex justify-between items-start mb-8 border-b border-[#10B981]/20 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#10B981] font-bold">AreaHustle V2.0</div>
                <h2 className="font-display text-2xl font-bold tracking-tight">Verified Credential</h2>
              </div>
              <ShieldCheck className="h-10 w-10 text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>

            {/* Premium holographic chip layout */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-widest font-semibold">Credential Owner</div>
                  <div className="text-lg font-bold font-display tracking-tight text-white mt-0.5">{proofCard.hustler_name}</div>
                </div>
                <div className="h-8 w-12 rounded bg-gradient-to-r from-yellow-500/80 to-yellow-400/80 border border-white/20 relative overflow-hidden">
                  {/* Holographic Chip Lines */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20" />
                  <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Hustler ID</div>
                  <div className="font-mono text-xs font-semibold tracking-wider text-[#10B981] mt-0.5">{proofCard.hustler_id}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Tenure</div>
                  <div className="font-semibold text-white mt-0.5">{proofCard.platform_tenure_months} Months</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">30d Income</div>
                  <div className="font-display font-bold text-[#10B981] text-base mt-0.5">{naira(proofCard.verified_income_30d)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">90d Income</div>
                  <div className="font-display font-bold text-white mt-0.5">{naira(proofCard.verified_income_90d)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Income Consistency</div>
                  <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                    {Math.round(proofCard.income_consistency_index * 100)}% <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">Jobs Completed</div>
                  <div className="font-semibold text-white mt-0.5">{proofCard.total_jobs_completed} Tasks</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>Verification Hash: {proofCard.verification_hash}</span>
                <span>Generated: {new Date(proofCard.generated_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(proofCard, null, 2));
                  toast.success("Credential verification payload copied!");
                }}
                className="w-full rounded-full bg-[#10B981] hover:bg-[#0da06f] text-[#0D3B2E] font-bold py-3.5 text-sm transition shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2"
              >
                Copy Cryptographic Proof Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
