import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@deck/ui";
import { useSearchParams } from "react-router-dom";
import { createFleetApi, type FleetShip } from "../api";

export default function FleetPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const queryClient = useQueryClient();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createFleetApi(getHost, setBackoffActive), [getHost]);
  const [searchParams, setSearchParams] = useSearchParams();
  const systemFilter = (searchParams.get("system") ?? "").trim();
  const [query, setQuery] = useState("");
  const [purchaseShipType, setPurchaseShipType] = useState("");
  const [purchaseWaypointSymbol, setPurchaseWaypointSymbol] = useState("");
  const [purchaseResult, setPurchaseResult] = useState<unknown>(null);
  const [purchaseError, setPurchaseError] = useState<unknown>(null);
  const [purchaseRunning, setPurchaseRunning] = useState(false);

  const ships = useQuery({
    queryKey: ["ships"],
    queryFn: ({ signal }) => api.listShips(signal),
    enabled: !!host?.getSession().token
  });

  function clearSystemFilter() {
    if (!systemFilter) return;
    const next = new URLSearchParams(searchParams);
    next.delete("system");
    setSearchParams(next, { replace: true });
  }

  const filteredShips = useMemo(() => {
    const items = ships.data?.data ?? [];
    const q = query.trim().toLowerCase();
    return items
      .filter((ship) => (systemFilter ? ship.nav.systemSymbol === systemFilter : true))
      .filter((ship) => {
        if (!q) return true;
        const hay = [
          ship.symbol,
          ship.registration?.role,
          ship.nav.status,
          ship.nav.systemSymbol,
          ship.nav.waypointSymbol,
          ship.nav.route?.destination?.symbol
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [query, ships.data?.data, systemFilter]);

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  function safeJson(value: unknown) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  async function purchaseShip() {
    const shipType = purchaseShipType.trim();
    const waypointSymbol = purchaseWaypointSymbol.trim();
    if (!shipType || !waypointSymbol) return;

    setPurchaseRunning(true);
    setPurchaseError(null);
    try {
      const res = await api.purchaseShip({ shipType, waypointSymbol });
      setPurchaseResult(res);
      await queryClient.invalidateQueries({ queryKey: ["ships"] });
    } catch (e) {
      setPurchaseError(e);
    } finally {
      setPurchaseRunning(false);
    }
  }

  function badgeVariantForStatus(status: string | undefined) {
    if (!status) return "neutral" as const;
    if (status === "IN_TRANSIT") return "warning" as const;
    if (status === "DOCKED") return "neutral" as const;
    return "default" as const;
  }

  function pct(value: number | undefined, max: number | undefined) {
    if (!value || !max) return 0;
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

  function openShip(ship: FleetShip) {
    host?.navigate(`/fleet/ships/${encodeURIComponent(ship.symbol)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-100">Fleet</h2>
          <div className="text-sm text-slate-400">
            {filteredShips.length}
            {systemFilter ? ` ship(s) in ${systemFilter}` : " ship(s)"}.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
          <Button variant="outline" size="sm" onClick={() => ships.refetch()} disabled={ships.isFetching}>
            {ships.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <details className="rounded-xl bg-slate-900/60 p-4 shadow-none">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">Purchase ship</summary>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={purchaseShipType} onChange={(e) => setPurchaseShipType(e.target.value)} placeholder="Ship type (e.g. SHIP_MINING_DRONE)" />
            <Input value={purchaseWaypointSymbol} onChange={(e) => setPurchaseWaypointSymbol(e.target.value)} placeholder="Waypoint symbol (shipyard)" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={purchaseShip} disabled={purchaseRunning || !purchaseShipType.trim() || !purchaseWaypointSymbol.trim()}>
              {purchaseRunning ? "Purchasing..." : "Purchase"}
            </Button>
            <div className="text-sm text-slate-400">Requires a shipyard at the waypoint.</div>
          </div>

          {purchaseError ? (
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-rose-950/30 p-3 text-xs text-rose-200">
              {safeJson(purchaseError)}
            </pre>
          ) : null}
          {purchaseResult ? (
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950/30 p-3 text-xs text-slate-200">
              {safeJson(purchaseResult)}
            </pre>
          ) : null}
        </div>
      </details>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vessels by symbol, role, status, system, waypoint..."
        />
        <div className="flex flex-wrap items-center gap-2">
          {systemFilter ? (
            <button className="deck-chip cursor-pointer" onClick={clearSystemFilter}>
              System: <span className="ml-1 font-semibold text-slate-100">{systemFilter}</span> <span className="ml-2">×</span>
            </button>
          ) : null}
        </div>
      </div>

      {ships.isLoading ? <div className="text-slate-300">Loading ships...</div> : null}
      {ships.isError ? <div className="text-rose-300">Failed to load ships.</div> : null}
      <div className="grid gap-3">
        {filteredShips.map((ship) => (
          <Card
            key={ship.symbol}
            onClick={() => openShip(ship)}
            className="cursor-pointer border-0 bg-slate-900/70 p-0 text-left shadow-none transition hover:bg-slate-800/80"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="truncate text-cyan-100">{ship.symbol}</CardTitle>
                    {ship.registration?.role ? <Badge variant="neutral">{ship.registration.role}</Badge> : null}
                    <Badge variant={badgeVariantForStatus(ship.nav.status)}>{ship.nav.status}</Badge>
                    {ship.nav.flightMode ? <Badge variant="neutral">{ship.nav.flightMode}</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    <span className="text-slate-400">Location:</span>{" "}
                    <span className="font-medium text-slate-200">{ship.nav.systemSymbol}</span> /{" "}
                    <span className="font-medium text-slate-200">{ship.nav.waypointSymbol}</span>
                    {ship.nav.route?.destination?.symbol && ship.nav.route.destination.symbol !== ship.nav.waypointSymbol ? (
                      <span className="text-slate-400">
                        {" "}
                        → <span className="text-slate-200">{ship.nav.route.destination.symbol}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-sm text-slate-400">View details →</div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 md:grid-cols-2">
              <Meter
                label="Fuel"
                value={ship.fuel?.current}
                max={ship.fuel?.capacity}
                valueLabel={
                  ship.fuel?.capacity ? (
                    <>
                      {ship.fuel.current}/{ship.fuel.capacity}
                    </>
                  ) : (
                    <>-</>
                  )
                }
                tone={ship.fuel?.capacity && ship.fuel.current / ship.fuel.capacity <= 0.2 ? "amber" : "emerald"}
              />
              <Meter
                label="Cargo"
                value={ship.cargo.units}
                max={ship.cargo.capacity}
                valueLabel={
                  <>
                    {ship.cargo.units}/{ship.cargo.capacity}
                  </>
                }
                tone="cyan"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
