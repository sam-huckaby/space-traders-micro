export type AgentSummary = {
  symbol: string;
  headquarters?: string;
  faction?: string;
  credits?: number;
};

export type SessionSnapshot = {
  token: string | null;
  agent: AgentSummary | null;
};

export type HostApi = {
  getSession(): SessionSnapshot;
  setSession(next: SessionSnapshot): void;
  logout(): void;
  navigate(to: string): void;
  toast(message: string, kind?: "info" | "success" | "error"): void;
};
