type DemoUser = {
  id: number;
  email: string;
  name: string;
  role: "customer" | "hustler";
  wallet_balance: number;
  trust_score: number;
};

const demoUser: DemoUser = {
  id: 1,
  email: "demo@areahustle.ng",
  name: "Demo Hustler",
  role: "hustler",
  wallet_balance: 24500,
  trust_score: 820,
};

const wait = () => new Promise((resolve) => setTimeout(resolve, 150));

const defaultJobs = [
  {
    id: "job-1",
    title: "Fix my generator",
    description: "Generator servicing and load test for a small apartment complex.",
    category: "Repairs",
    budget: 8000,
    location: "Lekki Phase 1",
    neighbourhood: "Lekki Phase 1",
    status: "open",
    customer: "Ada I.",
  },
  {
    id: "job-2",
    title: "House cleaning",
    description: "Deep clean for a 3-bedroom apartment and balcony.",
    category: "Cleaning",
    budget: 6500,
    location: "Yaba",
    neighbourhood: "Yaba",
    status: "open",
    customer: "Musa R.",
  },
  {
    id: "job-3",
    title: "Plumber needed",
    description: "Fix leaking pipe and replace kitchen sink trap.",
    category: "Plumbing",
    budget: 12000,
    location: "Ikeja GRA",
    neighbourhood: "Ikeja GRA",
    status: "open",
    customer: "Grace O.",
  },
];

const defaultProfile = {
  service_areas: ["Lekki Phase 1", "Yaba", "Ikoyi"],
  categories: ["General", "Cleaning", "Repairs", "Errands"],
};

const getLocalJobs = () => {
  if (typeof window === "undefined") return [...defaultJobs];
  const saved = window.localStorage.getItem("areahustle-demo-jobs");
  if (!saved) return [...defaultJobs];
  try {
    return JSON.parse(saved);
  } catch {
    return [...defaultJobs];
  }
};

const saveLocalJobs = (jobs: any[]) => {
  if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-jobs", JSON.stringify(jobs));
};

const getLocalProfile = () => {
  if (typeof window === "undefined") return { ...defaultProfile };
  const saved = window.localStorage.getItem("areahustle-demo-profile");
  if (!saved) return { ...defaultProfile };
  try {
    return JSON.parse(saved);
  } catch {
    return { ...defaultProfile };
  }
};

export const api = {
  login: async (data: any) => {
    await wait();
    return { access_token: `demo-token-${data?.username ?? "user"}` };
  },
  register: async (data: any) => {
    await wait();
    demoUser.email = data.email ?? demoUser.email;
    demoUser.name = data.name ?? demoUser.name;
    demoUser.role = data.role ?? demoUser.role;
    return { ...demoUser };
  },
  getMe: async () => {
    await wait();
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { ...demoUser };
        }
      }
    }
    return { ...demoUser };
  },
  updateWallet: async (amount: number) => {
    await wait();
    const current = await api.getMe();
    const next = { ...current, wallet_balance: Math.max(0, Number(current.wallet_balance || 0) + Number(amount || 0)) };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-user", JSON.stringify(next));
    return next;
  },
  getTasks: async ({ status, neighbourhood }: { status?: string; neighbourhood?: string } = {}) => {
    await wait();
    return getLocalJobs().filter((job: any) => {
      const matchesStatus = !status || job.status === status;
      const matchesLocation = !neighbourhood || (job.location || job.neighbourhood) === neighbourhood;
      return matchesStatus && matchesLocation;
    });
  },
  getMyTasks: async () => {
    await wait();
    return getLocalJobs().filter((job: any) => job.status !== "open");
  },
  createTask: async (data: any) => {
    await wait();
    const jobs = getLocalJobs();
    const next = {
      id: `job-${Date.now()}`,
      title: data.title ?? "New Task",
      description: data.description ?? "",
      category: data.category ?? "General",
      budget: Number(data.budget ?? 0),
      location: data.neighbourhood ?? "Lekki Phase 1",
      neighbourhood: data.neighbourhood ?? "Lekki Phase 1",
      status: "open",
      customer: "You",
    };
    saveLocalJobs([next, ...jobs]);
    return next;
  },
  matchTask: async (id: string) => {
    await wait();
    const jobs = getLocalJobs();
    const updated = jobs.map((job: any) => (job.id === id ? { ...job, status: "matched" } : job));
    saveLocalJobs(updated);
    return updated.find((job: any) => job.id === id);
  },
  activateTask: async (id: string) => {
    await wait();
    const jobs = getLocalJobs();
    const updated = jobs.map((job: any) => (job.id === id ? { ...job, status: "in_progress" } : job));
    saveLocalJobs(updated);
    return updated.find((job: any) => job.id === id);
  },
  completeTask: async (id: string) => {
    await wait();
    const jobs = getLocalJobs();
    const updated = jobs.map((job: any) => (job.id === id ? { ...job, status: "completed" } : job));
    saveLocalJobs(updated);
    return updated.find((job: any) => job.id === id);
  },
  updateTask: async (id: string, payload: any) => {
    await wait();
    const jobs = getLocalJobs();
    const updated = jobs.map((job: any) => (job.id === id ? { ...job, ...payload } : job));
    saveLocalJobs(updated);
    return updated.find((job: any) => job.id === id);
  },
  getPassport: async () => ({
    trust_score: 820,
    job_completion_rate: 96,
    on_time_arrival: 94,
    repeat_hire_ratio: 88,
    dispute_rate: 2,
  }),
  getProofCard: async () => ({
    hustler_name: "Demo Hustler",
    hustler_id: "AH-8201",
    platform_tenure_months: 9,
    verified_income_30d: 182000,
    verified_income_90d: 540000,
    income_consistency_index: 0.92,
    total_jobs_completed: 142,
    verification_hash: "AHX-2026-820",
    generated_at: new Date().toISOString(),
  }),
  getTransactions: async () => [
    { id: 1, type: "deposit", amount: 15000, date: "Today", desc: "Wallet top-up", location: "Lagos" },
    { id: 2, type: "payment", amount: -3200, date: "Yesterday", desc: "Generator repair payout", location: "Lekki" },
    { id: 3, type: "deposit", amount: 6000, date: "2 days ago", desc: "Task payout", location: "Yaba" },
  ],
  createHustlerProfile: async (data: any) => {
    await wait();
    const profile = { ...defaultProfile, ...data };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-profile", JSON.stringify(profile));
    return profile;
  },
  getHustlerProfile: async () => ({ ...getLocalProfile() }),
  updateHustlerProfile: async (data: any) => {
    await wait();
    const profile = { ...getLocalProfile(), ...data };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-profile", JSON.stringify(profile));
    return profile;
  },
  voiceToIntentUpload: async (_formData?: FormData) => ({
    category: "General",
    description: "Need a reliable helper for a quick errand and setup in Lekki Phase 1.",
    budget: 5000,
    neighbourhood: "Lekki Phase 1",
  }),
};
