"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, voiceApi } from "@/lib/api";
import { naira } from "@/lib/format";
import { MapPin, Lock, Phone, CheckCircle, Search, Mic, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

function Jobs() {
  const { isLoggedIn, isLoading: authLoading, userRole, user, refreshWallet } = useAuth();
  const [tab, setTab] = useState<"market" | "my-gigs">("market");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<string | null>(null);
  const [negotiatingJob, setNegotiatingJob] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [marketJobs, setMarketJobs] = useState<any[]>([]);
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [voiceFilter, setVoiceFilter] = useState<{ label: string; location: string; keyword: string } | null>(null);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || userRole !== "hustler") {
      window.location.href = "/";
      return;
    }

    const loadData = async () => {
      setLoadingMarket(true);
      try {
        const [jobs, gigs] = await Promise.all([
          api.getTasks({ status: "open", neighbourhood: location || undefined }),
          api.getMyTasks(),
        ]);
        setMarketJobs(jobs);
        setMyGigs(gigs);
      } finally {
        setLoadingMarket(false);
      }
    };

    loadData();
  }, [authLoading, isLoggedIn, location, userRole]);

  const refreshData = async () => {
    if (!isLoggedIn || userRole !== "hustler") return;
    const [jobs, gigs] = await Promise.all([
      api.getTasks({ status: "open", neighbourhood: location || undefined }),
      api.getMyTasks(),
    ]);
    setMarketJobs(jobs);
    setMyGigs(gigs);
  };

  // Live updates: poll the market and my-gigs so status changes made by the
  // customer (e.g. releasing escrow) arrive without a manual refresh.
  useEffect(() => {
    if (authLoading || !isLoggedIn || userRole !== "hustler") return;
    const timer = window.setInterval(() => void refreshData(), 10000);
    return () => window.clearInterval(timer);
  }, [authLoading, isLoggedIn, userRole, location]);

  const handleOffer = (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const amount = Number.parseInt(offerAmount, 10);
    if (amount > 0) {
      localStorage.setItem(
        `mock_offer_${jobId}`,
        JSON.stringify({ amount, hustlerName: user?.name || "A Hustler" }),
      );
      toast.success(`Offer of ${naira(amount)} sent to customer!`);
      setNegotiatingJob(null);
      setOfferAmount("");
    }
  };

  const handleAccept = async (id: string) => {
    setIsActionLoading(id);
    try {
      // The backend locks the escrow (debits the customer) at accept time.
      await api.matchTask(id);
      await refreshWallet();
      toast.success("Job accepted! Contact details unlocked.");
      setTab("my-gigs");
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept this job.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleActivate = async (id: string) => {
    setIsActionLoading(id);
    try {
      await api.activateTask(id);
      toast.success("Job started! You can now mark it as done when finished.");
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to start job.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleMarkDone = async (id: string) => {
    setIsActionLoading(id);
    try {
      await api.completeTask(id);
      toast.success("Job marked as done!", {
        description: "Waiting for the customer to confirm and release payment.",
      });
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark job as done.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const startVoiceSearch = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setIsVoiceSearching(false);
        setIsVoiceProcessing(true);
        const mimeType = mr.mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        try {
          const result = await voiceApi.voiceSearchJobs(audioBlob, "pcm");
          const jobs = Array.isArray(result?.jobs) ? result.jobs : [];
          if (jobs.length > 0) {
            setMarketJobs(jobs);
          }

          const filters = result?.filters ?? {};
          const nextKeyword = String(filters.keyword || keyword || "");
          const nextLocation = String(filters.location || location || "");
          setKeyword(nextKeyword);
          setLocation(nextLocation);
          setVoiceFilter(
            nextKeyword || nextLocation
              ? {
                  label: nextKeyword || "any work",
                  location: nextLocation,
                  keyword: nextKeyword,
                }
              : null,
          );
          toast.success(`Voice search matched ${jobs.length || 0} jobs.`);
        } catch (err: any) {
          const message = err?.message || "Could not clearly catch that. Please speak closer to the mic or try again.";
          toast.error(message.includes("clearly") ? message : "Could not clearly catch that. Please speak closer to the mic or try again.");
        } finally {
          setIsVoiceProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mr.start();
      setIsVoiceSearching(true);
      toast.info("Listening for your job search…");
    } catch {
      toast.error("Microphone access denied or not supported.");
      setIsVoiceSearching(false);
    }
  };

  const stopVoiceSearch = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const filteredMarket = marketJobs.filter((j) => {
    const matchKeyword = keyword
      ? (j.title?.toLowerCase().includes(keyword.toLowerCase()) || j.category?.toLowerCase().includes(keyword.toLowerCase()))
      : true;
    const matchLocation = location ? (j.location || j.neighbourhood)?.toLowerCase().includes(location.toLowerCase()) : true;
    return matchKeyword && matchLocation;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Job Feed</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Hustler Dashboard</h1>
        </div>
        <div className="flex bg-muted/50 rounded-full p-1 border">
          <button
            onClick={() => setTab("market")}
            className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition ${tab === "market" ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
          >
            Market ({filteredMarket.length})
          </button>
          <button
            onClick={() => setTab("my-gigs")}
            className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition ${tab === "my-gigs" ? "bg-background shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
          >
            My Gigs ({myGigs.length})
          </button>
        </div>
      </div>

      {tab === "market" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-card p-4 rounded-3xl shadow-soft border">
            <div className="flex-1 flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 focus-within:border-primary transition">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs by keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="sm:w-64 rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">All Locations</option>
              <option value="Lekki Phase 1">Lekki Phase 1</option>
              <option value="Yaba">Yaba</option>
              <option value="Ikeja">Ikeja</option>
              <option value="Ajah">Ajah</option>
            </select>
          </div>

          {voiceFilter && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                Filtered by Voice: &quot;{voiceFilter.keyword || voiceFilter.label}&quot; in {voiceFilter.location || "all areas"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setVoiceFilter(null);
                  setKeyword("");
                  setLocation("");
                }}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition"
              >
                Clear
              </button>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMarket.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-3xl">
                {loadingMarket ? "Loading open gigs..." : "No available jobs match your search."}
              </div>
            )}
            {filteredMarket.map((j, i) => {
              const mockBudgetStr = localStorage.getItem(`mock_budget_${j.id || j._id}`);
              const displayBudget = mockBudgetStr ? Number.parseInt(mockBudgetStr, 10) : j.budget;
              return (
                <article
                  key={j.id || j._id || i}
                  className="rounded-3xl bg-card border shadow-soft hover:shadow-elevated transition p-6 flex flex-col animate-fade-up relative overflow-hidden"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{j.category}</div>
                  <h3 className="font-display text-xl font-bold leading-snug mb-2">{j.title || j.category}</h3>
                  {j.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{j.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-5">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {j.location || j.neighbourhood}
                    </span>
                  </div>
                  <div className="border-t -mx-6 mb-4" />
                  <div className="mt-auto flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Payout</div>
                      <div className="font-display text-2xl font-bold">{naira(displayBudget)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {negotiatingJob === (j.id || j._id) ? (
                        <form onSubmit={(e) => handleOffer(e, j.id || j._id)} className="flex items-center gap-1">
                          <input
                            type="number"
                            autoFocus
                            required
                            placeholder="₦"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 rounded-full border px-3 py-2 text-xs"
                          />
                          <button type="submit" className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                            Send
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNegotiatingJob(null);
                            }}
                            className="rounded-full border px-3 py-2 text-xs font-semibold text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(j);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold hover:bg-muted transition"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNegotiatingJob(j.id || j._id);
                              setOfferAmount(String(j.budget || ""));
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 transition"
                          >
                            Propose Price
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleAccept(j.id || j._id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition"
                            disabled={isActionLoading === (j.id || j._id)}
                          >
                            <Lock className="h-3.5 w-3.5" /> Accept
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {tab === "my-gigs" && (
        <div className="space-y-4">
          {myGigs.length === 0 && (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-3xl">
              You have no active gigs. Head to the market!
            </div>
          )}
          {myGigs.map((j, i) => {
            const status = j.status || j.state;
            const mockBudgetStr = localStorage.getItem(`mock_budget_${j.id || j._id}`);
            const displayBudget = mockBudgetStr ? Number.parseInt(mockBudgetStr, 10) : j.budget;
            return (
              <div
                key={j.id || j._id || i}
                className="rounded-3xl bg-card border shadow-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up"
              >
                <div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block ${status === "accepted" || status === "matched" || status === "in_progress" || status === "active" ? "bg-primary/10 text-primary" : status === "awaiting_confirmation" ? "bg-orange-500/10 text-orange-600" : "bg-success/10 text-success"}`}
                  >
                    {status === "accepted" || status === "matched"
                      ? "Matched"
                      : status === "in_progress" || status === "active"
                        ? "In Progress"
                        : status === "awaiting_confirmation"
                          ? "Awaiting Confirmation"
                          : "Completed"}
                  </span>
                  <h3 className="font-display text-xl font-bold">{j.title || j.category}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1 text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Exact Location Revealed
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-success">{naira(displayBudget)} Locked</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                  {status === "accepted" || status === "matched" ? (
                    <>
                      <button
                        onClick={() => setShowPhoneModal((j as any).customerPhone || "+234 812 345 6789")}
                        className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
                      >
                        <Phone className="h-4 w-4" /> Call Customer
                      </button>
                      <button
                        onClick={() => void handleActivate(j.id || j._id)}
                        disabled={isActionLoading === (j.id || j._id)}
                        className="flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-95 transition"
                      >
                        Start Job
                      </button>
                    </>
                  ) : status === "in_progress" || status === "active" ? (
                    <>
                      <button
                        onClick={() => setShowPhoneModal((j as any).customerPhone || "+234 812 345 6789")}
                        className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
                      >
                        <Phone className="h-4 w-4" /> Call Customer
                      </button>
                      <button
                        onClick={() => void handleMarkDone(j.id || j._id)}
                        disabled={isActionLoading === (j.id || j._id)}
                        className="flex items-center justify-center gap-2 rounded-full bg-success text-success-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-95 transition"
                      >
                        <CheckCircle className="h-4 w-4" /> Mark as Done
                      </button>
                    </>
                  ) : status === "awaiting_confirmation" ? (
                    <div className="text-sm text-muted-foreground italic px-4">Waiting for customer to release escrow...</div>
                  ) : (
                    <div className="text-sm text-success font-semibold px-4 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Payment Received
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80 animate-fade-up">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border shadow-elevated p-8">
            <button onClick={() => setSelectedJob(null)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">{selectedJob.category}</div>
            <h2 className="font-display text-2xl font-bold mb-4">{selectedJob.title || selectedJob.category}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="h-4 w-4" /> {selectedJob.location || selectedJob.neighbourhood}
            </div>
            <div className="bg-muted/30 rounded-2xl p-4 mb-6 text-sm text-foreground leading-relaxed">
              {selectedJob.description || "No detailed description provided by the customer."}
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Payout</div>
                <div className="font-display text-2xl font-bold text-success">{naira(selectedJob.budget)}</div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition">
                  <Phone className="h-4 w-4" /> Contact
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setSelectedJob(null);
                    await handleAccept(selectedJob.id || selectedJob._id);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-95 transition"
                >
                  <Lock className="h-4 w-4" /> Accept Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end">
        {(isVoiceSearching || isVoiceProcessing) && (
          <div className="mb-4 bg-white rounded-2xl shadow-elevated border px-5 py-3 animate-fade-up origin-bottom-right flex items-center gap-3">
            <div className="flex items-center gap-1 h-5">
              {isVoiceProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#4F46E5]" />
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#4F46E5] rounded-full animate-wave"
                    style={{
                      height: "100%",
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: "0.8s"
                    }}
                  />
                ))
              )}
            </div>
            <span className="text-sm font-semibold text-[#0D3B2E]">
              {isVoiceProcessing ? "Processing..." : "Listening..."}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            if (isVoiceProcessing) return;
            if (isVoiceSearching) {
              stopVoiceSearch();
              return;
            }
            void startVoiceSearch();
          }}
          disabled={isVoiceProcessing}
          className={`relative group flex items-center justify-center rounded-full p-4 shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all duration-300 ${
            isVoiceSearching 
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
              : "bg-voice text-voice-foreground hover:opacity-95 hover:scale-105"
          } ${isVoiceProcessing ? "opacity-70 cursor-not-allowed" : ""}`}
          aria-label="Search jobs by voice"
        >
          <Mic className="h-6 w-6 relative z-10" />
          {isVoiceSearching && (
            <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" style={{ animationDuration: "1s" }}></span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Jobs;
