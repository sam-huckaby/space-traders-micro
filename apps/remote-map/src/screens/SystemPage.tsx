import React, { useEffect, useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@deck/ui";
import { useParams, useSearchParams } from "react-router-dom";
import { createMapApi } from "../api";
import { getWaypointStyle, waypointLegend } from "../mapTheme";

type Viewport = { tx: number; ty: number; scale: number };

const INITIAL_VIEW: Viewport = { tx: 400, ty: 300, scale: 1 };
const RINGS = [70, 140, 220, 320, 430, 560, 720, 900, 1100];

function systemFromWaypoint(waypointSymbol: string | undefined) {
  if (!waypointSymbol) return "";

  const parts = waypointSymbol.split("-");
  if (parts.length < 2) return "";

  return parts.slice(0, -1).join("-");
}

function getErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Unable to send ship to waypoint.";
  }

  const candidate = error as {
    message?: unknown;
    body?: unknown;
  };

  if (typeof candidate.body === "object" && candidate.body !== null) {
    const body = candidate.body as {
      message?: unknown;
      error?: { message?: unknown };
    };
    if (typeof body.error?.message === "string" && body.error.message.trim().length > 0) {
      return body.error.message;
    }
    if (typeof body.message === "string" && body.message.trim().length > 0) {
      return body.message;
    }
  }

  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  return "Unable to send ship to waypoint.";
}

export default function SystemPage({ getHost }: { getHost: () => HostApi | null }) {
  const { systemSymbol: routeSystemSymbol } = useParams();
  const [search] = useSearchParams();
  const host = getHost();
  const focusWaypoint = search.get("focusWaypoint");
  const systemFromQuery = search.get("system");
  const systemFromHq = systemFromWaypoint(host?.getSession().agent?.headquarters);
  const systemSymbol = useMemo(() => {
    const candidates = [routeSystemSymbol, systemFromQuery, systemFromHq];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
    return "";
  }, [routeSystemSymbol, systemFromHq, systemFromQuery]);
  const [backoffActive, setBackoffActive] = useState(false);
  const [selected, setSelected] = useState<string | null>(focusWaypoint);
  const [selectedShipSymbol, setSelectedShipSymbol] = useState("");
  const [view, setView] = useState<Viewport>(INITIAL_VIEW);
  const api = useMemo(() => createMapApi(getHost, setBackoffActive), [getHost]);

  useEffect(() => {
    setSelected(focusWaypoint);
  }, [focusWaypoint]);

  const waypoints = useQuery({
    queryKey: ["waypoints", systemSymbol],
    queryFn: ({ signal }) => api.listWaypoints(systemSymbol, signal),
    enabled: !!systemSymbol && !!host?.getSession().token
  });

  const ships = useQuery({
    queryKey: ["map-ships"],
    queryFn: ({ signal }) => api.listShips(signal),
    enabled: !!host?.getSession().token
  });

  useEffect(() => {
    if (!waypoints.data?.data.length) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(waypoints.data.data[0].symbol);
      return;
    }

    if (!waypoints.data.data.some((waypoint) => waypoint.symbol === selected)) {
      setSelected(waypoints.data.data[0].symbol);
    }
  }, [selected, waypoints.data]);

  const selectedWaypoint = waypoints.data?.data.find((waypoint) => waypoint.symbol === selected) ?? null;
  const shipsInSystem = useMemo(
    () => ships.data?.data.filter((ship) => ship.nav.systemSymbol === systemSymbol) ?? [],
    [ships.data, systemSymbol]
  );
  const selectedShip = useMemo(
    () => shipsInSystem.find((ship) => ship.symbol === selectedShipSymbol) ?? null,
    [selectedShipSymbol, shipsInSystem]
  );

  useEffect(() => {
    if (!shipsInSystem.length) {
      setSelectedShipSymbol("");
      return;
    }

    if (!shipsInSystem.some((ship) => ship.symbol === selectedShipSymbol)) {
      setSelectedShipSymbol(shipsInSystem[0].symbol);
    }
  }, [selectedShipSymbol, shipsInSystem]);

  const sendShip = useMutation({
    mutationFn: async () => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      if (!selectedShipSymbol) {
        throw new Error("Select a ship first.");
      }
      return api.navigateShip(selectedShipSymbol, selectedWaypoint.symbol);
    },
    onSuccess: (response) => {
      const destination =
        response.data?.nav?.route?.destination?.symbol ?? response.data?.nav?.waypointSymbol ?? selectedWaypoint?.symbol;
      const destinationLabel = destination ?? "the selected waypoint";
      host?.toast(`${selectedShipSymbol} is navigating to ${destinationLabel}.`, "success");
    },
    onError: (error) => {
      host?.toast(getErrorMessage(error), "error");
    }
  });

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const next = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({ ...v, scale: Math.max(0.2, Math.min(8, v.scale * next)) }));
  }

  function onDrag(e: React.MouseEvent<SVGSVGElement>) {
    if (e.buttons !== 1) return;
    setView((v) => ({ ...v, tx: v.tx + e.movementX, ty: v.ty + e.movementY }));
  }

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  if (!systemSymbol) {
    return (
      <div className="space-y-3">
        <div className="text-slate-200">No default system was found for this session.</div>
        <div className="text-sm text-slate-400">
          Open the galaxy map and pick a system, or add <code className="rounded bg-slate-800 px-1.5 py-0.5">?system=SYS</code> to the URL.
        </div>
        <Button onClick={() => host.navigate("/map/galaxy")}>Open galaxy map</Button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <div className="map-shell">
        <div className="relative h-full min-h-0 min-w-0 overflow-hidden">
          <svg className="deck-map block h-full w-full" viewBox="0 0 800 600" onWheel={onWheel} onMouseMove={onDrag}>
            <defs>
              <filter id="waypoint-selection-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
              {RINGS.map((radius) => (
                <circle key={radius} cx={0} cy={0} r={radius} fill="none" stroke="var(--color-radar-line-soft)" strokeWidth={1} />
              ))}

              <line x1={-2000} y1={0} x2={2000} y2={0} stroke="var(--color-radar-line)" strokeWidth={1.2} />
              <line x1={0} y1={-2000} x2={0} y2={2000} stroke="var(--color-radar-line)" strokeWidth={1.2} />

              {waypoints.data?.data.map((waypoint) => {
                const style = getWaypointStyle(waypoint.type);
                const isSelected = selected === waypoint.symbol;

                return (
                  <g key={waypoint.symbol} onClick={() => setSelected(waypoint.symbol)} style={{ cursor: "pointer" }}>
                    {isSelected ? (
                      <circle
                        cx={waypoint.x}
                        cy={-waypoint.y}
                        r={style.radius + 5}
                        fill="none"
                        stroke="var(--color-radar-glow)"
                        strokeWidth={1.5}
                        filter="url(#waypoint-selection-glow)"
                      />
                    ) : null}

                    <circle
                      cx={waypoint.x}
                      cy={-waypoint.y}
                      r={style.radius}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={1.25}
                    />

                    <text
                      x={waypoint.x + style.radius + 3}
                      y={-waypoint.y + 4}
                      fontSize={10}
                      fill={isSelected ? "#d7ffee" : "#9fd9bd"}
                      style={{ userSelect: "none" }}
                    >
                      {waypoint.symbol}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="map-detail-pane flex min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="map-detail-title">Waypoint Detail</div>
            <Button size="sm" variant="outline" onClick={() => setView(INITIAL_VIEW)}>
              Reset view
            </Button>
          </div>

          {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}

          <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
            {selectedWaypoint ? (
              <>
                <div>
                  <div className="map-detail-label">Symbol</div>
                  <div className="map-detail-value mt-1 font-semibold text-emerald-100">{selectedWaypoint.symbol}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="map-detail-label">Type</div>
                    <div className="map-detail-value mt-1">{selectedWaypoint.type}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">Construction</div>
                    <div className="map-detail-value mt-1">
                      {selectedWaypoint.isUnderConstruction ? "Under construction" : "Operational"}
                    </div>
                  </div>
                  <div>
                    <div className="map-detail-label">X</div>
                    <div className="map-detail-value mt-1">{selectedWaypoint.x}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">Y</div>
                    <div className="map-detail-value mt-1">{selectedWaypoint.y}</div>
                  </div>
                </div>

                <div className="space-y-2 rounded-md border border-emerald-300/20 bg-emerald-300/5 p-3">
                  <div className="map-detail-label">Send ship to this waypoint (optional)</div>
                  {ships.isLoading ? <div className="map-detail-value">Loading ships...</div> : null}
                  {ships.isError ? <div className="text-sm text-rose-300">Failed to load ships.</div> : null}

                  {!ships.isLoading && !ships.isError ? (
                    shipsInSystem.length > 0 ? (
                      <>
                        <select
                          className="w-full rounded-md border border-emerald-300/35 bg-emerald-950/60 px-2 py-1.5 text-sm text-emerald-50 outline-none focus:border-emerald-200/75"
                          value={selectedShipSymbol}
                          onChange={(event) => setSelectedShipSymbol(event.target.value)}
                        >
                          {shipsInSystem.map((ship) => (
                            <option key={ship.symbol} value={ship.symbol}>
                              {ship.symbol}
                            </option>
                          ))}
                        </select>
                        {selectedShip ? (
                          <div className="text-xs text-emerald-100/75">
                            Status: {selectedShip.nav.status} | Current waypoint: {selectedShip.nav.waypointSymbol}
                          </div>
                        ) : null}
                        <Button
                          size="sm"
                          disabled={
                            sendShip.isPending ||
                            !selectedShipSymbol ||
                            selectedShip?.nav.waypointSymbol === selectedWaypoint.symbol
                          }
                          onClick={() => sendShip.mutate()}
                        >
                          {selectedShip?.nav.waypointSymbol === selectedWaypoint.symbol
                            ? "Ship already at destination"
                            : sendShip.isPending
                              ? "Sending..."
                              : `Send ${selectedShipSymbol} here`}
                        </Button>
                      </>
                    ) : (
                      <div className="map-detail-value">No ships currently in {systemSymbol}.</div>
                    )
                  ) : null}
                </div>

                <div>
                  <div className="map-detail-label mb-2">Traits</div>
                  {(selectedWaypoint.traits ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWaypoint.traits?.map((trait) => (
                        <span key={trait.symbol} className="map-chip" title={trait.description ?? trait.name ?? trait.symbol}>
                          {trait.symbol}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="map-detail-value">No traits listed.</div>
                  )}
                </div>

                <div>
                  <div className="map-detail-label mb-2">Modifiers</div>
                  {(selectedWaypoint.modifiers ?? []).length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedWaypoint.modifiers?.map((modifier) => (
                        <div key={modifier.symbol} className="map-detail-value rounded-md border border-emerald-200/15 px-2 py-1">
                          {modifier.symbol}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="map-detail-value">No modifiers listed.</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="map-detail-label">Orbits</div>
                    <div className="map-detail-value mt-1">{selectedWaypoint.orbits ?? "-"}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">Orbitals</div>
                    <div className="map-detail-value mt-1">{selectedWaypoint.orbitals?.length ?? 0}</div>
                  </div>
                </div>

                <Button onClick={() => host.navigate(`/fleet?system=${encodeURIComponent(systemSymbol)}`)}>
                  Open fleet in system
                </Button>

                <div>
                  <div className="map-detail-label mb-2">Waypoint Type Legend</div>
                  <div className="space-y-1.5">
                    {waypointLegend.map((entry) => (
                      <div key={entry.type} className="flex items-center justify-between rounded-md border border-emerald-200/15 px-2 py-1">
                        <span className="text-xs text-emerald-100">{entry.type}</span>
                        <span
                          className="h-3.5 w-3.5 rounded-full border"
                          style={{ background: entry.fill, borderColor: entry.stroke }}
                          aria-hidden
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="map-detail-value">Select a waypoint on the map to inspect details.</div>
            )}
          </div>

          <div className="shrink-0 space-y-1 text-xs text-emerald-200/75">
            {waypoints.isLoading ? <div className="text-slate-300">Loading waypoints...</div> : null}
            {waypoints.isError ? <div className="text-rose-300">Failed to load waypoints.</div> : null}
            <div>Drag to pan, wheel to zoom, click to inspect waypoint details.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
