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

  function formatEta(arrival: string | undefined) {
    if (!arrival) return "-";
    const ts = Date.parse(arrival);
    if (!Number.isFinite(ts)) return arrival;
    const deltaMs = ts - Date.now();
    if (deltaMs <= 0) return "Arrived";
    const mins = Math.floor(deltaMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs <= 0) return `${mins}m`;
    return `${hrs}h ${remMins}m`;
  }

  function pct(value: number | undefined, max: number | undefined) {
    if (typeof value !== "number" || typeof max !== "number" || max <= 0) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  function Meter({
    label,
    value,
    max,
    valueLabel,
    tone
  }: {
    label: string;
    value: number | undefined;
    max: number | undefined;
    valueLabel: React.ReactNode;
    tone: "cyan" | "emerald" | "amber";
  }) {
    const percentage = pct(value, max);
    const bg =
      tone === "emerald"
        ? "bg-emerald-400/20"
        : tone === "amber"
          ? "bg-amber-400/20"
          : "bg-cyan-400/20";
    const fill =
      tone === "emerald"
        ? "bg-emerald-300/70"
        : tone === "amber"
          ? "bg-amber-300/70"
          : "bg-cyan-300/70";

    return (
      <div>
        <div className="flex items-center justify-between text-xs">
          <div className="uppercase tracking-[0.16em] text-slate-400">{label}</div>
          <div className="font-medium text-slate-200">{valueLabel}</div>
        </div>
        <div className={`mt-1 h-2 w-full overflow-hidden rounded-full border border-slate-700 ${bg}`}>
          <div className={`h-full ${fill}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  }

  function Stat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
        <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const system = ship.data?.data.nav.systemSymbol;
              host.navigate(system ? `/fleet?system=${encodeURIComponent(system)}` : "/fleet");
            }}
          >
            ← Fleet
          </Button>
          <h2 className="text-2xl font-semibold text-slate-100">{shipSymbol}</h2>
        </div>
        <div className="flex items-center gap-2">
          {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
        </div>
      </div>

      {ship.isLoading ? <div className="text-slate-300">Loading ship detail...</div> : null}
      {ship.isError ? <div className="text-rose-300">Failed to load ship detail.</div> : null}
      {ship.data ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-cyan-100">Location & Navigation</CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{ship.data.data.registration?.role ?? "VESSEL"}</Badge>
                    <Badge variant={ship.data.data.nav.status === "IN_TRANSIT" ? "warning" : "default"}>
                      {ship.data.data.nav.status}
                    </Badge>
                    {ship.data.data.nav.flightMode ? <Badge variant="neutral">{ship.data.data.nav.flightMode}</Badge> : null}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    host.navigate(
                      `/map/system/${encodeURIComponent(ship.data.data.nav.systemSymbol)}?focusWaypoint=${encodeURIComponent(
                        ship.data.data.nav.waypointSymbol
                      )}`
                    )
                  }
                >
                  View on map
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="System" value={ship.data.data.nav.systemSymbol} />
                <Stat label="Current waypoint" value={ship.data.data.nav.waypointSymbol} />
                <Stat label="Destination" value={ship.data.data.nav.route?.destination?.symbol ?? "-"} />
                <Stat label="ETA" value={formatEta(ship.data.data.nav.route?.arrival)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Meter
                  label="Fuel"
                  value={ship.data.data.fuel?.current}
                  max={ship.data.data.fuel?.capacity}
                  valueLabel={
                    ship.data.data.fuel?.capacity ? (
                      <>
                        {ship.data.data.fuel.current}/{ship.data.data.fuel.capacity}
                      </>
                    ) : (
                      <>-</>
                    )
                  }
                  tone={
                    ship.data.data.fuel?.capacity && ship.data.data.fuel.current / ship.data.data.fuel.capacity <= 0.2
                      ? "amber"
                      : "emerald"
                  }
                />
                <Meter
                  label="Cargo"
                  value={ship.data.data.cargo.units}
                  max={ship.data.data.cargo.capacity}
                  valueLabel={
                    <>
                      {ship.data.data.cargo.units}/{ship.data.data.cargo.capacity}
                    </>
                  }
                  tone="cyan"
                />
              </div>

              {ship.data.data.fuel?.consumed?.amount ? (
                <div className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-300">
                  Last fuel consumed:{" "}
                  <span className="font-semibold text-slate-100">{ship.data.data.fuel.consumed.amount}</span>
                  {ship.data.data.fuel.consumed.timestamp ? (
                    <span className="text-slate-400"> at {ship.data.data.fuel.consumed.timestamp}</span>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <CardTitle className="text-cyan-100">Ship Systems</CardTitle>
              <div className="space-y-3">
                <Stat label="Frame" value={ship.data.data.frame?.name ?? ship.data.data.frame?.symbol ?? "-"} />
                <Stat label="Reactor" value={ship.data.data.reactor?.name ?? ship.data.data.reactor?.symbol ?? "-"} />
                <Stat label="Engine" value={ship.data.data.engine?.name ?? ship.data.data.engine?.symbol ?? "-"} />
                <Stat label="Crew" value={ship.data.data.crew ? `${ship.data.data.crew.current}/${ship.data.data.crew.capacity}` : "-"} />
              </div>

              {ship.data.data.modules?.length ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Modules</div>
                  <div className="mt-2 space-y-2">
                    {ship.data.data.modules.map((m) => (
                      <div key={m.symbol} className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm">
                        <div className="font-semibold text-slate-100">{m.name ?? m.symbol}</div>
                        {m.description ? <div className="mt-0.5 text-xs text-slate-400">{m.description}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {ship.data.data.mounts?.length ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Mounts</div>
                  <div className="mt-2 space-y-2">
                    {ship.data.data.mounts.map((m) => (
                      <div key={m.symbol} className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm">
                        <div className="font-semibold text-slate-100">{m.name ?? m.symbol}</div>
                        {m.description ? <div className="mt-0.5 text-xs text-slate-400">{m.description}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-cyan-100">Inventory</CardTitle>
                <div className="text-sm text-slate-400">
                  {ship.data.data.cargo.units}/{ship.data.data.cargo.capacity} units
                </div>
              </div>

              {(ship.data.data.cargo.inventory ?? []).length > 0 ? (
                <ul className="grid gap-2 md:grid-cols-2">
                  {(ship.data.data.cargo.inventory ?? []).map((item) => (
                    <li
                      key={item.symbol}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-100">{item.name ?? item.symbol}</div>
                        {item.description ? <div className="mt-0.5 truncate text-xs text-slate-400">{item.description}</div> : null}
                      </div>
                      <div className="shrink-0 font-semibold text-cyan-100">{item.units}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-300">No inventory on board.</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
