import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardTitle } from "@deck/ui";
import { useParams, useSearchParams } from "react-router-dom";
import { createMapApi } from "../api";

export default function SystemPage({ getHost }: { getHost: () => HostApi | null }) {
  const { systemSymbol = "" } = useParams();
  const [search] = useSearchParams();
  const focusWaypoint = search.get("focusWaypoint");
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const [selected, setSelected] = useState<string | null>(focusWaypoint);
  const api = useMemo(() => createMapApi(getHost, setBackoffActive), [getHost]);

  const waypoints = useQuery({
    queryKey: ["waypoints", systemSymbol],
    queryFn: ({ signal }) => api.listWaypoints(systemSymbol, signal),
    enabled: !!systemSymbol && !!host?.getSession().token
  });

  const selectedWaypoint = waypoints.data?.data.find((w) => w.symbol === selected) ?? null;

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-100">System {systemSymbol}</h2>
          {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
        </div>
        <svg className="deck-map" width="100%" height="640" viewBox="0 0 800 600">
          <g transform="translate(400 300)">
            <line x1={-10000} y1={0} x2={10000} y2={0} stroke="#1e293b" />
            <line x1={0} y1={-10000} x2={0} y2={10000} stroke="#1e293b" />
            {waypoints.data?.data.map((w) => (
              <g key={w.symbol} onClick={() => setSelected(w.symbol)} style={{ cursor: "pointer" }}>
                <circle cx={w.x} cy={-w.y} r={selected === w.symbol ? 8 : 5} fill={selected === w.symbol ? "#22d3ee" : "#94a3b8"} />
                <text x={w.x + 8} y={-w.y + 4} fontSize={10} fill="#cbd5e1">
                  {w.symbol}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {waypoints.isLoading ? <div className="mt-2 text-slate-300">Loading waypoints...</div> : null}
        {waypoints.isError ? <div className="mt-2 text-rose-300">Failed to load waypoints.</div> : null}
      </div>
      <Card className="h-fit">
        <CardContent className="p-4">
        <CardTitle className="text-cyan-100">Waypoint detail</CardTitle>
        {selectedWaypoint ? (
          <>
            <div className="mt-3">
              <strong>{selectedWaypoint.symbol}</strong>
            </div>
            <div className="text-sm text-slate-300">Type: {selectedWaypoint.type}</div>
            <div className="text-sm text-slate-300">
              Coords: ({selectedWaypoint.x}, {selectedWaypoint.y})
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-200">Traits</div>
            <ul className="mt-2 space-y-1">
              {(selectedWaypoint.traits ?? []).map((t) => (
                <li key={t.symbol} className="text-sm text-slate-300">
                  {t.symbol}
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              onClick={() => host.navigate(`/fleet?system=${encodeURIComponent(systemSymbol)}`)}
            >
              Open fleet in system
            </Button>
          </>
        ) : (
          <div className="mt-3 text-sm text-slate-300">Select a waypoint on the map.</div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
