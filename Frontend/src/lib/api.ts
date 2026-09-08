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
    return demoUser;
  },
  getMe: async () => {
    await wait();
    return { ...demoUser };
  },
  updateWallet: async (amount: number) => {
    await wait();
    demoUser.wallet_balance += amount;
    return { ...demoUser };
  },
};
