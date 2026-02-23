import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@deck/ui";
import { createFleetApi } from "../api";

export default function FleetPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createFleetApi(getHost, setBackoffActive), [getHost]);

  const ships = useQuery({
    queryKey: ["ships"],
    queryFn: ({ signal }) => api.listShips(signal),
    enabled: !!host?.getSession().token
  });

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Fleet</h2>
        {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
      </div>

      {ships.isLoading ? <div className="text-slate-300">Loading ships...</div> : null}
      {ships.isError ? <div className="text-rose-300">Failed to load ships.</div> : null}
      <div className="grid gap-3">
        {ships.data?.data.map((ship) => (
          <Card
            key={ship.symbol}
            onClick={() => host.navigate(`/fleet/ships/${encodeURIComponent(ship.symbol)}`)}
            className="cursor-pointer p-0 text-left transition hover:border-cyan-300/40 hover:bg-slate-800/90"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-cyan-100">{ship.symbol}</CardTitle>
                <Badge variant="neutral">{ship.nav.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-300">Waypoint: {ship.nav.waypointSymbol}</div>
              <div className="mt-1 text-sm text-slate-300">
                Cargo: {ship.cargo.units}/{ship.cargo.capacity}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
