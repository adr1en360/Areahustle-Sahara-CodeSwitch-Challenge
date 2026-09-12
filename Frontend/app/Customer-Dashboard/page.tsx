"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { naira } from "@/lib/format";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Plus, CheckCircle, Clock, MapPin, Phone, Edit, X } from "lucide-react";
import { toast } from "sonner";

export default function CustomerDashboard() {
  const { isLoggedIn, isLoading: authLoading, userRole, user, updateDemoBalance } = useAuth();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [editingJob, setEditingJob] = useState<any>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<string | null>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const walletBalance = user?.wallet_balance || 0;

  const loadJobs = async () => {
    setIsLoading(true);
    const jobs = await api.getMyTasks();
    setMyJobs(jobs);
    setIsLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || userRole !== "customer") {
      window.location.href = "/";
      return;
    }

    void loadJobs();
  }, [isLoggedIn, userRole, authLoading]);

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(topUpAmount);
    if (amt && amt > 0) {
      updateDemoBalance("customer", amt);
      toast.success(`Successfully topped up ${naira(amt)}`);
      setTopUpOpen(false);
      setTopUpAmount("");
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(withdrawAmount);
    if (amt && amt > 0 && amt <= walletBalance) {
      updateDemoBalance("customer", -amt);
      toast.success(`Successfully withdrew ${naira(amt)} to bank.`);
      setWithdrawOpen(false);
      setWithdrawAmount("");
    } else if (amt > walletBalance) {
      toast.error("Insufficient balance.");
    } else {
      toast.error("Invalid amount.");
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    await api.completeTask(id);
    toast.success("Payment released! Escrow funds transferred to Hustler.");
    await loadJobs();
    setConfirmingId(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJob && editingJob.editsRemaining > 0) {
      setSavingEditId(editingJob.id);
      const currentEdits = parseInt(localStorage.getItem(`edit_count_${editingJob.id}`) || "0", 10);
      localStorage.setItem(`edit_count_${editingJob.id}`, (currentEdits + 1).toString());
      await api.updateTask(editingJob.id, {
        title: editingJob.title,
        description: editingJob.description,
        budget: editingJob.budget,
      });
      toast.success("Job updated successfully.");
      await loadJobs();
      setEditingJob(null);
      setSavingEditId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Customer Dashboard</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Manage your requests.</h1>
        </div>
        <button
          onClick={() => (window.location.href = "/post-task")}
          className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-full bg-voice text-voice-foreground px-5 py-3 text-sm font-semibold shadow-soft hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" /> Post New Task
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-3xl bg-primary text-primary-foreground p-7 shadow-soft flex flex-col justify-between">
          <div>
            <div className="text-xs opacity-70 uppercase tracking-widest">Wallet Balance</div>
            <div className="font-display text-4xl font-bold mt-2 tabular-nums">
              ₦<AnimatedNumber value={walletBalance} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setTopUpOpen(true)}
              className="flex-1 rounded-2xl bg-primary-foreground text-primary py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Top Up
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex-1 rounded-2xl border border-primary-foreground/30 text-primary-foreground py-3 text-sm font-semibold hover:bg-primary-foreground/10 transition"
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="md:col-span-2 rounded-3xl bg-card border shadow-soft p-7 flex flex-col justify-center text-center items-center">
          <h3 className="font-display text-xl font-bold mb-2">Need something done fast?</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">Use our voice-enabled task terminal to post a job in seconds.</p>
          <button
            onClick={() => (window.location.href = "/post-task")}
            className="rounded-full bg-muted border px-6 py-2.5 text-sm font-semibold hover:bg-muted/80 transition"
          >
            Try Voice Terminal
          </button>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-6">Active Jobs</h2>
      <div className="space-y-4">
        {myJobs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-3xl">
            {isLoading ? "Loading..." : "No active jobs found."}
          </div>
        ) : (
          myJobs.map((job: any, index: number) => {
            const jobId = job.id || job._id || index;
            const status = job.status || job.state || "open";
            const editsDone = parseInt(localStorage.getItem(`edit_count_${jobId}`) || "0", 10);
            const editsRemaining = Math.max(0, 3 - editsDone);
            let mockOffer = null;
            try {
              const str = localStorage.getItem(`mock_offer_${jobId}`);
              if (str) mockOffer = JSON.parse(str);
            } catch (e) {}

            const mockBudgetStr = localStorage.getItem(`mock_budget_${jobId}`);
            const displayBudget = mockBudgetStr ? parseInt(mockBudgetStr) : job.budget;

            return (
              <div
                key={jobId}
                className="rounded-3xl bg-card border shadow-soft p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${status === "open" || status === "pending" ? "bg-muted text-muted-foreground" : status === "matched" || status === "accepted" || status === "in_progress" || status === "active" ? "bg-primary/10 text-primary" : status === "awaiting_confirmation" ? "bg-orange-500/10 text-orange-600" : "bg-success/10 text-success"}`}
                    >
                      {status === "awaiting_confirmation"
                        ? "marked as done"
                        : status === "in_progress" || status === "active"
                          ? "in progress"
                          : status === "done" || status === "completed"
                            ? "completed"
                            : status}
                    </span>
                    <span className="text-xs text-muted-foreground">{job.category}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{job.title}</h3>
                  {job.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {naira(displayBudget)} in Escrow
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  {(status === "open" || status === "pending") && (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                      {mockOffer ? (
                        <div className="flex flex-col items-end gap-2 bg-muted/30 p-3 rounded-2xl border border-primary/20 animate-fade-up">
                          <span className="text-xs font-semibold text-primary">
                            {mockOffer.hustlerName} offered <span className="font-display font-bold text-lg">{naira(mockOffer.amount)}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                localStorage.setItem(`mock_budget_${jobId}`, mockOffer.amount.toString());
                                localStorage.removeItem(`mock_offer_${jobId}`);
                                toast.success("Offer accepted! Budget updated.");
                                await loadJobs();
                              }}
                              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                localStorage.removeItem(`mock_offer_${jobId}`);
                                await loadJobs();
                              }}
                              className="rounded-full border bg-white px-4 py-1.5 text-xs font-semibold hover:bg-muted transition"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Waiting for Hustler...</span>
                      )}
                      <button
                        onClick={() => setEditingJob({ ...job, id: jobId, editsRemaining })}
                        disabled={editsRemaining <= 0}
                        className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit ({editsRemaining} left)
                      </button>
                    </div>
                  )}
                  {(status === "matched" || status === "accepted" || status === "in_progress" || status === "active") && (
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        Assigned: <span className="font-semibold">{job.assignedHustler || "A Hustler"}</span>
                        {(status === "in_progress" || status === "active") && (
                          <span className="ml-1 text-primary text-[10px] font-bold uppercase tracking-widest">(Working)</span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPhoneModal((job as any).hustlerPhone || "+234 809 876 5432")}
                        className="h-10 w-10 shrink-0 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {status === "awaiting_confirmation" && (
                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <span className="text-xs text-orange-600 font-semibold italic px-1">Hustler marked as done. Please review.</span>
                      <button
                        onClick={() => handleConfirm(job.id || job._id)}
                        disabled={confirmingId === (job.id || job._id)}
                        className="w-full sm:w-auto justify-center rounded-full bg-[#183620] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-soft animate-pulse"
                      >
                        <CheckCircle className="h-4 w-4" /> Release Payment
                      </button>
                    </div>
                  )}
                  {(status === "done" || status === "completed") && (
                    <div className="text-sm text-success font-semibold sm:px-4 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Job Done
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {topUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80 animate-fade-up">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border shadow-elevated p-8">
            <h2 className="font-display text-xl font-bold mb-4">Top Up Wallet</h2>
            <form onSubmit={handleTopUp}>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Amount (e.g. 10000)"
                className="w-full rounded-2xl border bg-muted/30 px-4 py-3 text-lg font-semibold mb-4 outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setTopUpOpen(false)} className="flex-1 rounded-full border py-3 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!topUpAmount}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Paystack Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80 animate-fade-up">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border shadow-elevated p-8">
            <h2 className="font-display text-xl font-bold mb-2">Withdraw Funds</h2>
            <p className="text-xs text-muted-foreground mb-4">Available balance: {naira(walletBalance)}</p>
            <form onSubmit={handleWithdraw}>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount (e.g. 5000)"
                max={walletBalance}
                className="w-full rounded-2xl border bg-muted/30 px-4 py-3 text-lg font-semibold mb-4 outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setWithdrawOpen(false)} className="flex-1 rounded-full border py-3 text-sm font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!withdrawAmount}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80 animate-fade-up">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border shadow-elevated p-8 text-center">
            <button onClick={() => setShowPhoneModal(null)} className="absolute right-5 top-5 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-4">
              <Phone className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Contact Hustler</h2>
            <p className="text-muted-foreground text-sm mb-6">Reach out directly via call or WhatsApp.</p>
            <div className="rounded-2xl bg-muted/30 border py-5 mb-6">
              <div className="font-display text-3xl font-bold tracking-tight text-foreground">{showPhoneModal}</div>
            </div>
            <a
              href={`tel:${showPhoneModal}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-success py-3.5 text-sm font-bold text-white shadow-soft hover:opacity-90 transition"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-background/80 animate-fade-up">
          <div className="relative w-full max-w-md rounded-3xl bg-card border shadow-elevated p-8">
            <button onClick={() => setEditingJob(null)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-display text-xl font-bold mb-4">Edit Task</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={editingJob.title || ""}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  required
                  rows={3}
                  className="mt-1 w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget (₦)</label>
                <input
                  type="number"
                  value={editingJob.budget}
                  onChange={(e) => setEditingJob({ ...editingJob, budget: Number(e.target.value) })}
                  required
                  className="mt-1 w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={savingEditId === editingJob?.id}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground mt-2 disabled:opacity-50"
              >
                {savingEditId === editingJob?.id ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
