import type { HostApi, SessionSnapshot } from "@deck/contracts";
import { clearSession, saveSession } from "./sessionStore";

export function createHostApi(params: {
  getSession: () => SessionSnapshot;
  setSession: (s: SessionSnapshot) => void;
  navigate: (to: string) => void;
  toast: (msg: string, kind?: "info" | "success" | "error") => void;
}): HostApi {
  return {
    getSession: params.getSession,
    setSession: (next) => {
      params.setSession(next);
      saveSession(next);
    },
    logout: () => {
      clearSession();
      params.setSession({ token: null, agent: null });
      params.navigate("/session");
    },
    navigate: params.navigate,
    toast: params.toast
  };
}
