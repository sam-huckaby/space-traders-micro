import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@deck/ui";
import { createContractsApi } from "../api";

export default function ContractsPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createContractsApi(getHost, setBackoffActive), [getHost]);

  const contracts = useQuery({
    queryKey: ["contracts"],
    queryFn: ({ signal }) => api.listContracts(signal),
    enabled: !!host?.getSession().token
  });

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Contracts</h2>
        {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
      </div>

      {contracts.isLoading ? <div className="text-slate-300">Loading contracts...</div> : null}
      {contracts.isError ? <div className="text-rose-300">Failed to load contracts.</div> : null}
      <div className="grid gap-3">
        {contracts.data?.data.map((c) => (
          <Card
            key={c.id}
            onClick={() => host.navigate(`/contracts/${encodeURIComponent(c.id)}`)}
            className="cursor-pointer p-0 text-left transition hover:border-cyan-300/40 hover:bg-slate-800/90"
          >
            <CardHeader className="pb-1">
              <CardTitle className="text-base text-cyan-100">{c.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-300">Faction: {c.factionSymbol}</div>
              <div className="mt-1 text-sm text-slate-300">
                State: {c.fulfilled ? "Fulfilled" : c.accepted ? "Accepted" : "Pending"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
