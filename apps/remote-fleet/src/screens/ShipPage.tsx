import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardTitle, Input } from "@deck/ui";
import { useParams } from "react-router-dom";
import { createFleetApi } from "../api";

export default function ShipPage({ getHost }: { getHost: () => HostApi | null }) {
  const { shipSymbol = "" } = useParams();
  const host = getHost();
  const queryClient = useQueryClient();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createFleetApi(getHost, setBackoffActive), [getHost]);
  const [actionState, setActionState] = useState<
    | null
    | {
      name: string;
      status: "running" | "success" | "error";
      startedAt: number;
      endedAt?: number;
      result?: unknown;
      error?: unknown;
    }
  >(null);

  const [navigateWaypoint, setNavigateWaypoint] = useState("");
  const [warpWaypoint, setWarpWaypoint] = useState("");
  const [jumpWaypoint, setJumpWaypoint] = useState("");
  const [flightMode, setFlightMode] = useState("");

  const [tradeSymbol, setTradeSymbol] = useState("");
  const [tradeUnits, setTradeUnits] = useState<number>(1);
  const [transferToShipSymbol, setTransferToShipSymbol] = useState("");
  const [transferTradeSymbol, setTransferTradeSymbol] = useState("");
  const [transferUnits, setTransferUnits] = useState<number>(1);
  const [refuelUnits, setRefuelUnits] = useState<string>("");
  const [refuelFromCargo, setRefuelFromCargo] = useState(false);

  const [installMountSymbol, setInstallMountSymbol] = useState("");
  const [removeMountSymbol, setRemoveMountSymbol] = useState("");
  const [installModuleSymbol, setInstallModuleSymbol] = useState("");
  const [removeModuleSymbol, setRemoveModuleSymbol] = useState("");

  const [refineProduce, setRefineProduce] = useState("");
  const [extractSurveyJson, setExtractSurveyJson] = useState("");

  const ship = useQuery({
    queryKey: ["ship", shipSymbol],
    queryFn: ({ signal }) => api.getShip(shipSymbol, signal),
    enabled: !!shipSymbol && !!host?.getSession().token
  });

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

  async function runAction(name: string, fn: () => Promise<unknown>) {
    const startedAt = Date.now();
    setActionState({ name, status: "running", startedAt });
    try {
      const result = await fn();
      const endedAt = Date.now();
      setActionState({ name, status: "success", startedAt, endedAt, result });
      await queryClient.invalidateQueries({ queryKey: ["ship", shipSymbol] });
      await queryClient.invalidateQueries({ queryKey: ["ships"] });
      return result;
    } catch (error) {
      const endedAt = Date.now();
      setActionState({ name, status: "error", startedAt, endedAt, error });
      throw error;
    }
  }

  const actionRunning = actionState?.status === "running";

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
          <Card className="border-0 bg-slate-900/70 shadow-none lg:col-span-2">
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

          <div className="space-y-3">
            <Card className="border-0 bg-slate-900/70 shadow-none">
              <CardContent className="space-y-4 p-5">
                <CardTitle className="text-cyan-100">Actions</CardTitle>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => runAction("Orbit ship", () => api.orbitShip(shipSymbol))}
                    disabled={actionRunning}
                  >
                    Orbit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runAction("Dock ship", () => api.dockShip(shipSymbol))}
                    disabled={actionRunning}
                  >
                    Dock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      runAction("Refuel ship", () => {
                        const raw = refuelUnits.trim();
                        const parsed = raw ? Number(raw) : undefined;
                        const units = typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
                        const payload = units ? { units, fromCargo: refuelFromCargo } : refuelFromCargo ? { fromCargo: true } : undefined;
                        return api.refuelShip(shipSymbol, payload);
                      })
                    }
                    disabled={
                      actionRunning ||
                      (refuelUnits.trim()
                        ? !Number.isFinite(Number(refuelUnits)) || Number(refuelUnits) <= 0
                        : false)
                    }
                  >
                    Refuel
                  </Button>
                </div>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Navigation</summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Navigate</div>
                      <div className="flex gap-2">
                        <Input
                          value={navigateWaypoint}
                          onChange={(e) => setNavigateWaypoint(e.target.value)}
                          placeholder="Waypoint symbol"
                        />
                        <Button
                          onClick={() =>
                            runAction("Navigate ship", () =>
                              api.navigateShip(shipSymbol, { waypointSymbol: navigateWaypoint.trim() })
                            )
                          }
                          disabled={actionRunning || !navigateWaypoint.trim()}
                        >
                          Go
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Warp</div>
                      <div className="flex gap-2">
                        <Input value={warpWaypoint} onChange={(e) => setWarpWaypoint(e.target.value)} placeholder="Waypoint symbol" />
                        <Button
                          onClick={() => runAction("Warp ship", () => api.warpShip(shipSymbol, { waypointSymbol: warpWaypoint.trim() }))}
                          disabled={actionRunning || !warpWaypoint.trim()}
                        >
                          Warp
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Jump</div>
                      <div className="flex gap-2">
                        <Input value={jumpWaypoint} onChange={(e) => setJumpWaypoint(e.target.value)} placeholder="Waypoint symbol" />
                        <Button
                          onClick={() => runAction("Jump ship", () => api.jumpShip(shipSymbol, { waypointSymbol: jumpWaypoint.trim() }))}
                          disabled={actionRunning || !jumpWaypoint.trim()}
                        >
                          Jump
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Flight mode</div>
                      <div className="flex gap-2">
                        <Input value={flightMode} onChange={(e) => setFlightMode(e.target.value)} placeholder="CRUISE / DRIFT / BURN / STEALTH" />
                        <Button
                          variant="outline"
                          onClick={() => runAction("Patch ship nav", () => api.patchShipNav(shipSymbol, { flightMode: flightMode.trim() }))}
                          disabled={actionRunning || !flightMode.trim()}
                        >
                          Set
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => runAction("Get ship nav", () => api.getShipNav(shipSymbol))} disabled={actionRunning}>
                        Get nav
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => runAction("Get ship cooldown", () => api.getShipCooldown(shipSymbol))}
                        disabled={actionRunning}
                      >
                        Get cooldown
                      </Button>
                    </div>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Cargo & Trade</summary>
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => runAction("Get ship cargo", () => api.getShipCargo(shipSymbol))} disabled={actionRunning}>
                        Get cargo
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Buy / Sell / Jettison</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={tradeSymbol} onChange={(e) => setTradeSymbol(e.target.value)} placeholder="Trade symbol" />
                        <Input
                          value={String(tradeUnits)}
                          onChange={(e) => setTradeUnits(Number(e.target.value || 0))}
                          placeholder="Units"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => runAction("Purchase cargo", () => api.purchaseCargo(shipSymbol, { symbol: tradeSymbol.trim(), units: tradeUnits }))}
                          disabled={actionRunning || !tradeSymbol.trim() || !Number.isFinite(tradeUnits) || tradeUnits <= 0}
                        >
                          Buy
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => runAction("Sell cargo", () => api.sellCargo(shipSymbol, { symbol: tradeSymbol.trim(), units: tradeUnits }))}
                          disabled={actionRunning || !tradeSymbol.trim() || !Number.isFinite(tradeUnits) || tradeUnits <= 0}
                        >
                          Sell
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => runAction("Jettison cargo", () => api.jettison(shipSymbol, { symbol: tradeSymbol.trim(), units: tradeUnits }))}
                          disabled={actionRunning || !tradeSymbol.trim() || !Number.isFinite(tradeUnits) || tradeUnits <= 0}
                        >
                          Jettison
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Transfer</div>
                      <div className="grid gap-2">
                        <Input value={transferToShipSymbol} onChange={(e) => setTransferToShipSymbol(e.target.value)} placeholder="Destination ship symbol" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input value={transferTradeSymbol} onChange={(e) => setTransferTradeSymbol(e.target.value)} placeholder="Trade symbol" />
                          <Input
                            value={String(transferUnits)}
                            onChange={(e) => setTransferUnits(Number(e.target.value || 0))}
                            placeholder="Units"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction("Transfer cargo", () =>
                            api.transferCargo(shipSymbol, {
                              shipSymbol: transferToShipSymbol.trim(),
                              tradeSymbol: transferTradeSymbol.trim(),
                              units: transferUnits
                            })
                          )
                        }
                        disabled={
                          actionRunning ||
                          !transferToShipSymbol.trim() ||
                          !transferTradeSymbol.trim() ||
                          !Number.isFinite(transferUnits) ||
                          transferUnits <= 0
                        }
                      >
                        Transfer
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Refuel options</div>
                      <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
                        <Input value={refuelUnits} onChange={(e) => setRefuelUnits(e.target.value)} placeholder="Units (optional)" inputMode="numeric" />
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={refuelFromCargo}
                            onChange={(e) => setRefuelFromCargo(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                          />
                          Use cargo fuel
                        </label>
                      </div>
                    </div>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Mining & Production</summary>
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => runAction("Create survey", () => api.createSurvey(shipSymbol))} disabled={actionRunning}>
                        Create survey
                      </Button>
                      <Button onClick={() => runAction("Extract resources", () => api.extractResources(shipSymbol))} disabled={actionRunning}>
                        Extract
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => runAction("Extract via /extract/survey", () => api.extractResourcesWithSurvey(shipSymbol))}
                        disabled={actionRunning}
                      >
                        Extract (survey)
                      </Button>
                      <Button variant="outline" onClick={() => runAction("Siphon resources", () => api.siphonResources(shipSymbol))} disabled={actionRunning}>
                        Siphon
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Extract with survey JSON (optional)</div>
                      <textarea
                        value={extractSurveyJson}
                        onChange={(e) => setExtractSurveyJson(e.target.value)}
                        rows={4}
                        placeholder='Paste survey JSON (the "survey" object). Leave empty to extract without survey.'
                        className="w-full resize-y rounded-md bg-slate-950/40 px-3 py-2 text-xs text-slate-200 outline-none ring-1 ring-slate-800/60 focus:ring-cyan-300/40"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction("Extract (survey JSON)", async () => {
                            const raw = extractSurveyJson.trim();
                            if (!raw) return api.extractResources(shipSymbol);
                            const survey = JSON.parse(raw) as unknown;
                            return api.extractResources(shipSymbol, { survey });
                          })
                        }
                        disabled={actionRunning}
                      >
                        Extract (with survey JSON)
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Refine</div>
                      <div className="flex gap-2">
                        <Input value={refineProduce} onChange={(e) => setRefineProduce(e.target.value)} placeholder="Produce (e.g. IRON)" />
                        <Button
                          variant="outline"
                          onClick={() => runAction("Refine ship", () => api.refineShip(shipSymbol, { produce: refineProduce.trim() }))}
                          disabled={actionRunning || !refineProduce.trim()}
                        >
                          Refine
                        </Button>
                      </div>
                    </div>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Scanning & Charting</summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => runAction("Create chart", () => api.createChart(shipSymbol))} disabled={actionRunning}>
                      Create chart
                    </Button>
                    <Button variant="outline" onClick={() => runAction("Scan ships", () => api.scanShips(shipSymbol))} disabled={actionRunning}>
                      Scan ships
                    </Button>
                    <Button variant="outline" onClick={() => runAction("Scan systems", () => api.scanSystems(shipSymbol))} disabled={actionRunning}>
                      Scan systems
                    </Button>
                    <Button variant="outline" onClick={() => runAction("Scan waypoints", () => api.scanWaypoints(shipSymbol))} disabled={actionRunning}>
                      Scan waypoints
                    </Button>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Equipment</summary>
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" onClick={() => runAction("Get mounts", () => api.getMounts(shipSymbol))} disabled={actionRunning}>
                        Get mounts
                      </Button>
                      <Button variant="ghost" onClick={() => runAction("Get modules", () => api.getModules(shipSymbol))} disabled={actionRunning}>
                        Get modules
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Mounts</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={installMountSymbol} onChange={(e) => setInstallMountSymbol(e.target.value)} placeholder="Install mount symbol" />
                        <Input value={removeMountSymbol} onChange={(e) => setRemoveMountSymbol(e.target.value)} placeholder="Remove mount symbol" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => runAction("Install mount", () => api.installMount(shipSymbol, { symbol: installMountSymbol.trim() }))}
                          disabled={actionRunning || !installMountSymbol.trim()}
                        >
                          Install mount
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => runAction("Remove mount", () => api.removeMount(shipSymbol, { symbol: removeMountSymbol.trim() }))}
                          disabled={actionRunning || !removeMountSymbol.trim()}
                        >
                          Remove mount
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Modules</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={installModuleSymbol} onChange={(e) => setInstallModuleSymbol(e.target.value)} placeholder="Install module symbol" />
                        <Input value={removeModuleSymbol} onChange={(e) => setRemoveModuleSymbol(e.target.value)} placeholder="Remove module symbol" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => runAction("Install module", () => api.installModule(shipSymbol, { symbol: installModuleSymbol.trim() }))}
                          disabled={actionRunning || !installModuleSymbol.trim()}
                        >
                          Install module
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => runAction("Remove module", () => api.removeModule(shipSymbol, { symbol: removeModuleSymbol.trim() }))}
                          disabled={actionRunning || !removeModuleSymbol.trim()}
                        >
                          Remove module
                        </Button>
                      </div>
                    </div>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Maintenance</summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => runAction("Get repair quote", () => api.getRepairQuote(shipSymbol))} disabled={actionRunning}>
                      Repair quote
                    </Button>
                    <Button variant="danger" onClick={() => runAction("Repair ship", () => api.repairShip(shipSymbol))} disabled={actionRunning}>
                      Repair
                    </Button>
                    <Button variant="outline" onClick={() => runAction("Get scrap quote", () => api.getScrapQuote(shipSymbol))} disabled={actionRunning}>
                      Scrap quote
                    </Button>
                    <Button variant="danger" onClick={() => runAction("Scrap ship", () => api.scrapShip(shipSymbol))} disabled={actionRunning}>
                      Scrap
                    </Button>
                  </div>
                </details>

                <details className="rounded-lg bg-slate-950/30 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-200">Contracts</summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => runAction("Negotiate contract", () => api.negotiateContract(shipSymbol))}
                      disabled={actionRunning}
                    >
                      Negotiate contract
                    </Button>
                  </div>
                </details>

                <div className="rounded-lg bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Last response</div>
                    {actionState ? (
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">{actionState.name}</span>{" "}
                        <span className={actionState.status === "error" ? "text-rose-300" : actionState.status === "success" ? "text-emerald-300" : "text-amber-300"}>
                          {actionState.status}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950/30 p-3 text-xs text-slate-200">
                    {actionState
                      ? actionState.status === "error"
                        ? safeJson(actionState.error)
                        : safeJson(actionState.result)
                      : "Run an action to see the API response here."}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-slate-900/70 shadow-none">
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
                    <div className="mt-2 overflow-hidden rounded-lg bg-slate-950/30">
                      <ul className="divide-y divide-slate-800/60">
                        {ship.data.data.modules.map((m) => (
                          <li key={m.symbol} className="px-3 py-2 text-sm">
                            <div className="font-semibold text-slate-100">{m.name ?? m.symbol}</div>
                            {m.description ? <div className="mt-0.5 text-xs text-slate-400">{m.description}</div> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {ship.data.data.mounts?.length ? (
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Mounts</div>
                    <div className="mt-2 overflow-hidden rounded-lg bg-slate-950/30">
                      <ul className="divide-y divide-slate-800/60">
                        {ship.data.data.mounts.map((m) => (
                          <li key={m.symbol} className="px-3 py-2 text-sm">
                            <div className="font-semibold text-slate-100">{m.name ?? m.symbol}</div>
                            {m.description ? <div className="mt-0.5 text-xs text-slate-400">{m.description}</div> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 bg-slate-900/70 shadow-none lg:col-span-3">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-cyan-100">Inventory</CardTitle>
                <div className="text-sm text-slate-400">
                  {ship.data.data.cargo.units}/{ship.data.data.cargo.capacity} units
                </div>
              </div>

              {(ship.data.data.cargo.inventory ?? []).length > 0 ? (
                <div className="overflow-hidden rounded-lg bg-slate-950/30">
                  <ul className="divide-y divide-slate-800/60">
                    {(ship.data.data.cargo.inventory ?? []).map((item) => (
                      <li key={item.symbol} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{item.name ?? item.symbol}</div>
                          {item.description ? <div className="mt-0.5 truncate text-xs text-slate-400">{item.description}</div> : null}
                        </div>
                        <div className="shrink-0 font-semibold text-cyan-100">{item.units}</div>
                      </li>
                    ))}
                  </ul>
                </div>
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
