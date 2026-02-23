import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";
import type { RemoteModule, SessionSnapshot } from "@deck/contracts";
import { Alert, Button, Card, CardContent } from "@deck/ui";
import { createHostApi } from "./hostApi";
import { loadRemote } from "./remotes";
import { loadSession } from "./sessionStore";

function useToast() {
  return useCallback((msg: string, kind: "info" | "success" | "error" = "info") => {
    const method = kind === "error" ? "error" : "log";
    console[method](`[${kind}] ${msg}`);
  }, []);
}

function Shell() {
  const nav = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState<SessionSnapshot>(() => loadSession());
  const [remotes, setRemotes] = useState<RemoteModule[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const hostApi = useMemo(
    () =>
      createHostApi({
        getSession: () => sessionRef.current,
        setSession,
        navigate: nav,
        toast
      }),
    [nav, toast]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const names = ["session", "fleet", "map", "contracts"] as const;
      const maxAttempts = 12;
      let lastDown: string[] = names.slice();

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const loaded = await Promise.allSettled(names.map((n) => loadRemote(n)));
        const ok: RemoteModule[] = [];
        const down: string[] = [];

        loaded.forEach((result, idx) => {
          const name = names[idx];
          if (result.status === "fulfilled") {
            result.value.init(hostApi);
            ok.push(result.value);
          } else {
            down.push(name);
          }
        });

        if (cancelled) {
          return;
        }

        setUnavailable(down);
        setRemotes(ok);
        lastDown = down;

        if (down.length === 0) {
          return;
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!cancelled) {
        toast(`Remote unavailable after retries: ${lastDown.join(", ")}`, "error");
      }
    })().catch(() => toast("Failed loading remotes", "error"));

    return () => {
      cancelled = true;
    };
  }, [hostApi, toast]);

  const hasToken = !!session.token;
  const navItems = remotes
    .flatMap((m) => m.navItems ?? [])
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-950 text-slate-100 md:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-800 bg-slate-950/90 p-4 md:border-r md:border-b-0">
        <div className="mb-4 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2">
          <div className="text-xs uppercase tracking-widest text-cyan-300">SpaceTraders</div>
          <div className="text-lg font-semibold">Command Deck</div>
          <div className="mt-2 text-xs text-slate-300">Agent: {session.agent?.symbol ?? "-"}</div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((it) => (
            <NavLink
              key={it.key}
              to={it.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-300/20 text-cyan-100"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <Button className="mt-4 w-full" onClick={() => hostApi.logout()}>
          Logout
        </Button>

        {unavailable.length > 0 ? (
          <Alert className="mt-4 border-amber-300/30 bg-amber-300/10 text-xs text-amber-200">
            Down: {unavailable.join(", ")}
          </Alert>
        ) : null}
      </aside>

      <main className="p-4 md:p-6">
        <Card className="min-h-[calc(100vh-2rem)]">
          <CardContent className="p-4 md:p-6">
          <Routes>
            <Route path="/" element={hasToken ? <Navigate to="/fleet" /> : <Navigate to="/session" />} />
            {remotes.flatMap((m, i) =>
              m.routes.map((r) => <Route key={`${i}:${r.path}`} path={r.path} element={r.element} />)
            )}
            <Route path="*" element={<div className="text-slate-300">Not found</div>} />
          </Routes>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
