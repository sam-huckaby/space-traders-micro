import type { SessionSnapshot } from "@deck/contracts";

const STORAGE_KEY = "st.session.v1";

export function loadSession(): SessionSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, agent: null };
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    return { token: null, agent: null };
  }
}

export function saveSession(s: SessionSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
