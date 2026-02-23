import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardTitle } from "@deck/ui";
import { useParams } from "react-router-dom";
import { createFleetApi } from "../api";

export default function ShipPage({ getHost }: { getHost: () => HostApi | null }) {
  const { shipSymbol = "" } = useParams();
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createFleetApi(getHost, setBackoffActive), [getHost]);

  const ship = useQuery({
    queryKey: ["ship", shipSymbol],
    queryFn: ({ signal }) => api.getShip(shipSymbol, signal),
    enabled: !!shipSymbol && !!host?.getSession().token
  });

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Ship {shipSymbol}</h2>
        {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
      </div>

      {ship.isLoading ? <div className="text-slate-300">Loading ship detail...</div> : null}
      {ship.isError ? <div className="text-rose-300">Failed to load ship detail.</div> : null}
      {ship.data ? (
        <Card>
          <CardContent className="space-y-3 p-5">
          <CardTitle className="text-cyan-100">Operational Status</CardTitle>
          <div>
            <span className="text-slate-400">Status:</span> <strong>{ship.data.data.nav.status}</strong>
          </div>
          <div>
            <span className="text-slate-400">System:</span> <strong>{ship.data.data.nav.systemSymbol}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">Waypoint:</span> <strong>{ship.data.data.nav.waypointSymbol}</strong>
            <Button
              onClick={() =>
                host?.navigate(
                  `/map/system/${encodeURIComponent(
                    ship.data.data.nav.systemSymbol
                  )}?focusWaypoint=${encodeURIComponent(ship.data.data.nav.waypointSymbol)}`
                )
              }
            >
              View on map
            </Button>
          </div>
          <div>
            <span className="text-slate-400">Cargo:</span>{" "}
            <strong>
              {ship.data.data.cargo.units}/{ship.data.data.cargo.capacity}
            </strong>
          </div>
          <h3 className="pt-2 text-lg font-medium text-cyan-100">Inventory</h3>
          <ul className="space-y-2">
            {ship.data.data.cargo.inventory.map((item) => (
              <li key={item.symbol} className="flex items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-sm">
                <span>{item.symbol}</span>
                <span className="font-semibold text-cyan-100">{item.units}</span>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
