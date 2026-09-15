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
const ENV_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = (ENV_URL && ENV_URL !== "/" && ENV_URL.trim() !== "" && !ENV_URL.includes("3000") ? ENV_URL : "https://areahustle-backend.onrender.com").replace(/\/$/, "");

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

export const voiceApi = {
  async transcribeVoiceTask(audioBlob: Blob, lang: string = "pcm") {
    const formData = new FormData();
    const ext = audioBlob.type?.includes("webm") ? "webm" : audioBlob.type?.includes("ogg") ? "ogg" : "wav";
    formData.append("file", audioBlob, `speech.${ext}`);
    formData.append("lang", lang || "pcm");

    const response = await fetch(`${API_BASE}/api/voice/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Voice transcription failed.");
    }

    return await response.json();
  },

  async voiceSearchJobs(audioBlob: Blob, lang: string = "pcm") {
    const formData = new FormData();
    const ext = audioBlob.type?.includes("webm") ? "webm" : audioBlob.type?.includes("ogg") ? "ogg" : "wav";
    formData.append("file", audioBlob, `query.${ext}`);
    formData.append("lang", lang || "pcm");

    const response = await fetch(`${API_BASE}/api/voice/search`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Voice search failed.");
    }

    return await response.json();
  },
};

export const api = {
  login: async (data: any) => {
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

  register: async (data: any) => {
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

  getMe: async () => {
    let userId = "1";
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) userId = parsed.id;
        } catch {}
      }
    }
    try {
      const result = await requestJson(`/api/users/profile/${userId}`);
      return result;
    } catch {
      return { ...demoUser, id: userId };
    }
  },

  updateWallet: async (amount: number) => {
    await wait();
    const current = await api.getMe();
    const next = { ...current, wallet_balance: Math.max(0, Number(current.wallet_balance || 0) + Number(amount || 0)) };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-user", JSON.stringify(next));
    return next;
  },

  getTasks: async ({ status, neighbourhood }: { status?: string; neighbourhood?: string } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (neighbourhood) params.set("neighbourhood", neighbourhood);
    const result = await requestJson(`/api/tasks${params.toString() ? `?${params.toString()}` : ""}`);
    return Array.isArray(result) ? result.map(normalizeJob) : [];
  },

  getMyTasks: async () => {
    let userId = "demo";
    let role = "customer";
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) userId = parsed.id;
          if (parsed?.role) role = parsed.role;
        } catch {}
      }
    }
    const queryParam = role === "hustler" ? `hustler_id=${userId}` : `customer_id=${userId}`;
    const result = await requestJson(`/api/tasks/my?${queryParam}`);
    return Array.isArray(result) ? result.map(normalizeJob) : [];
  },

  createTask: async (data: any) => {
    let userId = "demo";
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) userId = parsed.id;
        } catch {}
      }
    }
    const payload = {
      title: data.title,
      description: data.description,
      budget: Number(data.budget ?? 0),
      neighbourhood: data.neighbourhood ?? "Lekki Phase 1",
      category: data.category ?? "General",
      customer_id: data.customer_id ?? userId,
      status: data.status ?? "open",
    };
    const result = await requestJson("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeJob(result);
  },

  matchTask: async (id: string) => {
    let userId = "demo";
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) userId = parsed.id;
        } catch {}
      }
    }
    const result = await requestJson(`/api/tasks/${id}/match?hustler_id=${userId}`, { method: "POST" });
    return result;
  },

  activateTask: async (id: string) => {
    const result = await requestJson(`/api/tasks/${id}/activate`, { method: "POST" });
    return result;
  },

  completeTask: async (id: string) => {
    const result = await requestJson(`/api/tasks/${id}/complete`, { method: "POST" });
    return result;
  },

  updateTask: async (id: string, payload: any) => {
    const result = await requestJson(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return result;
  },

  getPassport: async (userId = "demo") => {
    const result = await requestJson(`/api/passport/profile/${userId}`);
    return result;
  },

  verifyIdentity: async (userId: string, data: { identity_type: string; document_number: string; id_document: File }) => {
    const formData = new FormData();
    formData.append("identity_type", data.identity_type);
    formData.append("document_number", data.document_number);
    formData.append("id_document", data.id_document);

    const result = await requestJson(`/api/passport/verify/${userId}`, {
      method: "POST",
      body: formData,
    });
    return result;
  },

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

  getTransactions: async (userId = "demo") => {
    let id = userId;
    if (id === "demo" && typeof window !== "undefined") {
      const saved = window.localStorage.getItem("areahustle-demo-user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) id = parsed.id;
        } catch {}
      }
    }
    const result = await requestJson(`/api/transactions/user/${id}`);
    return Array.isArray(result) ? result : [];
  },

  processEscrowIntent: async (data: { gig_id: string; client_id: string; hustler_id: string; amount: number; action: string; currency?: string }) => {
    const result = await requestJson("/api/transactions/process-intent", {
      method: "POST",
      body: JSON.stringify({ ...data, currency: data.currency || "NGN" }),
    });
    return result;
  },

  createHustlerProfile: async (data: any) => {
    await wait();
    const profile = { ...defaultProfile, ...data };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-profile", JSON.stringify(profile));
    return profile;
  },

  getHustlerProfile: async () => {
    const me = await api.getMe();
    const localProfile = getLocalProfile();
    return { ...me, ...localProfile };
  },

  updateHustlerProfile: async (data: any) => {
    await wait();
    const profile = { ...getLocalProfile(), ...data };
    if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-profile", JSON.stringify(profile));
    return profile;
  },

  voiceToIntentUpload: async (formData?: FormData) => {
    const file = formData?.get("file");
    const lang = (formData?.get("lang") as string | null) || "pcm";

    if (!file || !(file instanceof Blob)) {
      throw new Error("No valid audio file provided.");
    }

    const result = await voiceApi.transcribeVoiceTask(file as Blob, lang);
    if (result?.entities) return result.entities;
    if (result?.category || result?.description || result?.budget || result?.neighbourhood) return result;
    
    throw new Error("Failed to parse intent from audio.");
  },
};
