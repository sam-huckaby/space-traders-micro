import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@deck/ui";

const BASE_URL = "https://api.spacetraders.io/v2";
const PROXY_URL = import.meta.env.VITE_BACKEND_PROXY_URL ?? "http://localhost:5180";

type AgentResponse = {
  data: {
    symbol: string;
    credits: number;
    headquarters?: string;
    startingFaction?: string;
  };
};

export default function SessionPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const session = host?.getSession();
  const [tokenInput, setTokenInput] = useState(session?.token ?? "");
  const [agentSymbol, setAgentSymbol] = useState("");
  const [busy, setBusy] = useState(false);

  const http = useMemo(
    () =>
      createHttpClient({
        baseUrl: BASE_URL,
        getToken: () => tokenInput || null
      }),
    [tokenInput]
  );

  async function validateAndSaveToken() {
    if (!host || !tokenInput) return;
    setBusy(true);
    try {
      const me = await http.request<AgentResponse>("/my/agent");
      host.setSession({
        token: tokenInput,
        agent: {
          symbol: me.data.symbol,
          credits: me.data.credits,
          headquarters: me.data.headquarters,
          faction: me.data.startingFaction
        }
      });
      host.toast("Session loaded", "success");
      host.navigate("/fleet");
    } catch {
      host.toast(
        "Token invalid (often after server resets). Start new game / switch token / clear.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  }

  async function registerNewAgent() {
    if (!host || agentSymbol.length < 3 || agentSymbol.length > 14) return;
    setBusy(true);
    try {
      const res = await fetch(`${PROXY_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: agentSymbol, faction: "COSMIC" })
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json?.error || json?.message || json?.error?.message || "Failed to register agent";
        throw new Error(msg);
      }
      const token = json.data.token as string;
      const agent = json.data.agent;
      host.setSession({
        token,
        agent: {
          symbol: agent.symbol,
          headquarters: agent.headquarters,
          faction: agent.startingFaction,
          credits: agent.credits
        }
      });
      host.toast("New agent registered", "success");
      host.navigate("/fleet");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to register agent";
      host.toast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">Session</h2>
        <p className="mt-1 text-sm text-slate-400">Start a new run or continue with an existing token.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-cyan-100">Continue game</CardTitle>
          <CardDescription>Use an existing bearer token to load your commander profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your bearer token"
          />
          <Button className="mt-3" disabled={busy || !tokenInput} onClick={validateAndSaveToken}>
            Continue
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-cyan-100">Start new game</CardTitle>
          <CardDescription>Register a new agent symbol and receive a fresh token.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={agentSymbol}
              onChange={(e) => setAgentSymbol(e.target.value.toUpperCase())}
              placeholder="AGENT SYMBOL (3-14 chars)"
            />
          </div>
          <Button
            className="mt-3"
            disabled={busy || agentSymbol.length < 3 || agentSymbol.length > 14}
            onClick={registerNewAgent}
          >
            Register
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
