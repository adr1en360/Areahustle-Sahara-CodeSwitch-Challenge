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
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

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

const requestJson = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers ?? {});
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    let detail = "Request failed";
    try {
      detail = JSON.parse(text).detail || JSON.parse(text).message || detail;
    } catch {
      detail = text || detail;
    }
    throw new Error(detail);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const withFallback = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await operation();
  } catch {
    return fallback;
  }
};

const normalizeJob = (job: any) => ({
  ...job,
  id: job.id ?? job._id ?? `job-${Date.now()}`,
  location: job.location ?? job.neighbourhood ?? "Lekki Phase 1",
  neighbourhood: job.neighbourhood ?? job.location ?? "Lekki Phase 1",
  status: job.status ?? "open",
  budget: Number(job.budget ?? 0),
});

export const api = {
  login: async (data: any) =>
    withFallback(
      async () => {
        const result = await requestJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: data?.email ?? data?.username, password: data?.password }),
        });
        return {
          access_token: result.access_token || `demo-token-${Date.now()}`,
          user_id: result.user_id,
          role: result.role || (String(data?.username ?? "").includes("customer") ? "customer" : "hustler"),
          email: data?.email ?? data?.username,
        };
      },
      {
        access_token: `demo-token-${data?.username ?? data?.email ?? "user"}`,
        user_id: data?.user_id ?? 1,
        role: data?.role ?? (String(data?.username ?? "").includes("customer") ? "customer" : "hustler"),
        email: data?.email ?? data?.username,
      },
    ),

  register: async (data: any) =>
    withFallback(
      async () => {
        const result = await requestJson("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            role: data.role ?? "customer",
          }),
        });
        const user = {
          id: result.user_id ?? 1,
          email: data.email,
          name: data.name ?? data.email.split("@")[0],
          role: data.role ?? "customer",
          wallet_balance: data.role === "customer" ? 60000 : 24500,
          trust_score: data.role === "customer" ? 0 : 820,
          access_token: result.access_token || `demo-token-${Date.now()}`,
        };
        if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-user", JSON.stringify(user));
        return user;
      },
      {
        ...demoUser,
        id: 1,
        email: data.email ?? demoUser.email,
        name: data.name ?? demoUser.name,
        role: data.role ?? demoUser.role,
        access_token: `demo-token-${data?.email ?? "user"}`,
      },
    ),

  getMe: async () => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("areahustle-demo-user") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore malformed local cache
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

  getTasks: async ({ status, neighbourhood }: { status?: string; neighbourhood?: string } = {}) =>
    withFallback(
      async () => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (neighbourhood) params.set("neighbourhood", neighbourhood);
        const result = await requestJson(`/api/tasks${params.toString() ? `?${params.toString()}` : ""}`);
        return Array.isArray(result) ? result.map(normalizeJob) : [];
      },
      getLocalJobs().filter((job: any) => {
        const matchesStatus = !status || job.status === status;
        const matchesLocation = !neighbourhood || (job.location || job.neighbourhood) === neighbourhood;
        return matchesStatus && matchesLocation;
      }),
    ),

  getMyTasks: async () =>
    withFallback(
      async () => {
        const result = await requestJson("/api/tasks/my");
        return Array.isArray(result) ? result.map(normalizeJob) : [];
      },
      getLocalJobs().filter((job: any) => job.status !== "open"),
    ),

  createTask: async (data: any) =>
    withFallback(
      async () => {
        const payload = {
          title: data.title,
          description: data.description,
          budget: Number(data.budget ?? 0),
          neighbourhood: data.neighbourhood ?? "Lekki Phase 1",
          category: data.category ?? "General",
          customer_id: data.customer_id ?? "demo-customer",
          status: data.status ?? "open",
        };
        const result = await requestJson("/api/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return normalizeJob(result);
      },
      (() => {
        const jobs = getLocalJobs();
        const next = normalizeJob({
          id: `job-${Date.now()}`,
          title: data.title ?? "New Task",
          description: data.description ?? "",
          category: data.category ?? "General",
          budget: Number(data.budget ?? 0),
          location: data.neighbourhood ?? "Lekki Phase 1",
          neighbourhood: data.neighbourhood ?? "Lekki Phase 1",
          status: "open",
          customer: "You",
        });
        saveLocalJobs([next, ...jobs]);
        return next;
      })(),
    ),

  matchTask: async (id: string) =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/tasks/${id}/match`, { method: "POST" });
        return result;
      },
      (() => {
        const jobs = getLocalJobs();
        const updated = jobs.map((job: any) => (String(job.id ?? job._id) === String(id) ? { ...job, status: "matched" } : job));
        saveLocalJobs(updated);
        return updated.find((job: any) => String(job.id ?? job._id) === String(id));
      })(),
    ),

  activateTask: async (id: string) =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/tasks/${id}/activate`, { method: "POST" });
        return result;
      },
      (() => {
        const jobs = getLocalJobs();
        const updated = jobs.map((job: any) => (String(job.id ?? job._id) === String(id) ? { ...job, status: "in_progress" } : job));
        saveLocalJobs(updated);
        return updated.find((job: any) => String(job.id ?? job._id) === String(id));
      })(),
    ),

  completeTask: async (id: string) =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/tasks/${id}/complete`, { method: "POST" });
        return result;
      },
      (() => {
        const jobs = getLocalJobs();
        const updated = jobs.map((job: any) => (String(job.id ?? job._id) === String(id) ? { ...job, status: "completed" } : job));
        saveLocalJobs(updated);
        return updated.find((job: any) => String(job.id ?? job._id) === String(id));
      })(),
    ),

  updateTask: async (id: string, payload: any) =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        return result;
      },
      (() => {
        const jobs = getLocalJobs();
        const updated = jobs.map((job: any) => (String(job.id ?? job._id) === String(id) ? { ...job, ...payload } : job));
        saveLocalJobs(updated);
        return updated.find((job: any) => String(job.id ?? job._id) === String(id));
      })(),
    ),

  getPassport: async (userId = "demo") =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/passport/profile/${userId}`);
        return result;
      },
      {
        trust_score: 820,
        job_completion_rate: 96,
        on_time_arrival: 94,
        repeat_hire_ratio: 88,
        dispute_rate: 2,
      },
    ),

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

  getTransactions: async (userId = "demo") =>
    withFallback(
      async () => {
        const result = await requestJson(`/api/transactions/user/${userId}`);
        return Array.isArray(result) ? result : [];
      },
      [
        { id: 1, type: "deposit", amount: 15000, date: "Today", desc: "Wallet top-up", location: "Lagos" },
        { id: 2, type: "payment", amount: -3200, date: "Yesterday", desc: "Generator repair payout", location: "Lekki" },
        { id: 3, type: "deposit", amount: 6000, date: "2 days ago", desc: "Task payout", location: "Yaba" },
      ],
    ),

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

  voiceToIntentUpload: async (formData?: FormData) => {
    if (!formData) {
      return {
        category: "General",
        description: "Need a reliable helper for a quick errand and setup in Lekki Phase 1.",
        budget: 5000,
        neighbourhood: "Lekki Phase 1",
      };
    }

    try {
      const file = formData.get("file");
      const payload = new FormData();
      if (file) payload.append("file", file);

      const result = await requestJson("/api/tasks/voice-intent", {
        method: "POST",
        body: payload,
      });

      if (result?.entities) return result.entities;
      if (result?.category || result?.description || result?.budget || result?.neighbourhood) return result;
      return {
        category: "General",
        description: "Need a reliable helper for a quick errand and setup in Lekki Phase 1.",
        budget: 5000,
        neighbourhood: "Lekki Phase 1",
      };
    } catch {
      return {
        category: "General",
        description: "Need a reliable helper for a quick errand and setup in Lekki Phase 1.",
        budget: 5000,
        neighbourhood: "Lekki Phase 1",
      };
    }
  },
};
