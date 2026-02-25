import React, { useEffect, useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge, Button, Input } from "@deck/ui";
import { useParams, useSearchParams } from "react-router-dom";
import { createMapApi } from "../api";
import { getWaypointStyle, waypointLegend } from "../mapTheme";
import { ApiDisclosure, ApiErrorAlert, JsonPreview, getApiErrorMessage } from "../components/apiPanels";

type Viewport = { tx: number; ty: number; scale: number };
type SortMode = "symbol" | "type" | "distance";

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

function distanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
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
  const [pendingCenter, setPendingCenter] = useState<string | null>(focusWaypoint);
  const [selectedShipSymbol, setSelectedShipSymbol] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("symbol");
  const [railCompact, setRailCompact] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [view, setView] = useState<Viewport>(INITIAL_VIEW);
  const [waypointsPage, setWaypointsPage] = useState(1);
  const [waypointsLimit, setWaypointsLimit] = useState(10);
  const [waypointsType, setWaypointsType] = useState("");
  const [waypointsTraits, setWaypointsTraits] = useState("");
  const [supplyShipSymbol, setSupplyShipSymbol] = useState("");
  const [supplyTradeSymbol, setSupplyTradeSymbol] = useState("");
  const [supplyUnits, setSupplyUnits] = useState(1);
  const api = useMemo(() => createMapApi(getHost, setBackoffActive), [getHost]);

  useEffect(() => {
    setSelected(focusWaypoint);
    setPendingCenter(focusWaypoint);
  }, [focusWaypoint]);

  const waypoints = useQuery({
    queryKey: ["waypoints", systemSymbol],
    queryFn: ({ signal }) => api.listWaypoints(systemSymbol, signal),
    enabled: !!systemSymbol && !!host?.getSession().token
  });

  const waypointData = waypoints.data?.data ?? [];

  const ships = useQuery({
    queryKey: ["map-ships"],
    queryFn: ({ signal }) => api.listShips(signal),
    enabled: !!host?.getSession().token
  });

  const systemDetail = useQuery({
    queryKey: ["system-detail", systemSymbol],
    queryFn: ({ signal }) => api.getSystem(systemSymbol, signal),
    enabled: false
  });

  const waypointsPaged = useQuery({
    queryKey: ["waypoints-paged", systemSymbol, waypointsPage, waypointsLimit, waypointsType, waypointsTraits],
    queryFn: ({ signal }) => {
      const traits = waypointsTraits
        .split(/[,\s]+/g)
        .map((trait) => trait.trim())
        .filter((trait) => trait.length > 0);
      return api.listWaypointsPage(
        systemSymbol,
        { page: waypointsPage, limit: waypointsLimit, type: waypointsType, traits: traits.length > 0 ? traits : undefined },
        signal
      );
    },
    enabled: false
  });

  useEffect(() => {
    if (!waypointData.length) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(waypointData[0].symbol);
      return;
    }

    if (!waypointData.some((waypoint) => waypoint.symbol === selected)) {
      setSelected(waypointData[0].symbol);
    }
  }, [selected, waypointData]);

  const selectedWaypoint = waypointData.find((waypoint) => waypoint.symbol === selected) ?? null;

  const waypointDetail = useQuery({
    queryKey: ["waypoint-detail", systemSymbol, selectedWaypoint?.symbol],
    queryFn: ({ signal }) => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      return api.getWaypoint(systemSymbol, selectedWaypoint.symbol, signal);
    },
    enabled: false
  });

  const market = useQuery({
    queryKey: ["waypoint-market", systemSymbol, selectedWaypoint?.symbol],
    queryFn: ({ signal }) => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      return api.getMarket(systemSymbol, selectedWaypoint.symbol, signal);
    },
    enabled: false
  });

  const shipyard = useQuery({
    queryKey: ["waypoint-shipyard", systemSymbol, selectedWaypoint?.symbol],
    queryFn: ({ signal }) => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      return api.getShipyard(systemSymbol, selectedWaypoint.symbol, signal);
    },
    enabled: false
  });

  const jumpGate = useQuery({
    queryKey: ["waypoint-jump-gate", systemSymbol, selectedWaypoint?.symbol],
    queryFn: ({ signal }) => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      return api.getJumpGate(systemSymbol, selectedWaypoint.symbol, signal);
    },
    enabled: false
  });

  const constructionSite = useQuery({
    queryKey: ["waypoint-construction", systemSymbol, selectedWaypoint?.symbol],
    queryFn: ({ signal }) => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }
      return api.getConstruction(systemSymbol, selectedWaypoint.symbol, signal);
    },
    enabled: false
  });

  useEffect(() => {
    if (!pendingCenter || !waypointData.length) return;
    if (waypointData.some((waypoint) => waypoint.symbol === pendingCenter)) return;
    setPendingCenter(null);
  }, [pendingCenter, waypointData]);

  useEffect(() => {
    if (!pendingCenter || !selectedWaypoint) return;
    if (selectedWaypoint.symbol !== pendingCenter) return;

    setView((v) => {
      const scale = v.scale;
      const px = selectedWaypoint.x;
      const py = -selectedWaypoint.y;
      return { ...v, tx: 400 - px * scale, ty: 300 - py * scale };
    });
    setPendingCenter(null);
  }, [pendingCenter, selectedWaypoint]);

  const waypointTypes = useMemo(
    () => Array.from(new Set(waypointData.map((waypoint) => waypoint.type).filter(Boolean))).sort(),
    [waypointData]
  );

  const filteredWaypoints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const next = waypointData.filter((waypoint) => {
      if (typeFilter !== "ALL" && waypoint.type !== typeFilter) {
        return false;
      }

      if (query.length > 0 && !waypoint.symbol.toLowerCase().includes(query)) {
        return false;
      }

      return true;
    });

    next.sort((a, b) => {
      if (sortMode === "type") {
        const byType = a.type.localeCompare(b.type);
        if (byType !== 0) {
          return byType;
        }
      }

      if (sortMode === "distance" && selectedWaypoint) {
        const da = distanceSquared(a, selectedWaypoint);
        const db = distanceSquared(b, selectedWaypoint);
        if (da !== db) {
          return da - db;
        }
      }

      return a.symbol.localeCompare(b.symbol);
    });

    return next;
  }, [searchTerm, selectedWaypoint, sortMode, typeFilter, waypointData]);

  const filteredWaypointSymbols = useMemo(
    () => new Set(filteredWaypoints.map((waypoint) => waypoint.symbol)),
    [filteredWaypoints]
  );

  const selectedInFilters = selected ? filteredWaypointSymbols.has(selected) : false;

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

  useEffect(() => {
    if (!supplyShipSymbol && selectedShipSymbol) {
      setSupplyShipSymbol(selectedShipSymbol);
    }
  }, [selectedShipSymbol, supplyShipSymbol]);

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
      host?.toast(getApiErrorMessage(error) || "Unable to send ship to waypoint.", "error");
    }
  });

  const supplyConstruction = useMutation({
    mutationFn: async () => {
      if (!selectedWaypoint) {
        throw new Error("Select a waypoint first.");
      }

      const shipSymbol = supplyShipSymbol.trim();
      const tradeSymbol = supplyTradeSymbol.trim().toUpperCase();
      const units = Math.max(1, Math.floor(supplyUnits));

      if (!shipSymbol) {
        throw new Error("Enter a ship symbol.");
      }
      if (!tradeSymbol) {
        throw new Error("Enter a trade symbol.");
      }

      return api.supplyConstruction(systemSymbol, selectedWaypoint.symbol, { shipSymbol, tradeSymbol, units });
    },
    onSuccess: () => {
      host?.toast("Supplied construction materials.", "success");
      constructionSite.refetch();
    },
    onError: (error) => {
      host?.toast(getApiErrorMessage(error) || "Unable to supply construction materials.", "error");
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

  function centerOnWaypoint(symbol: string | null) {
    if (!symbol) {
      return;
    }

    const waypoint = waypointData.find((entry) => entry.symbol === symbol);
    if (!waypoint) {
      return;
    }

    setView((v) => {
      const px = waypoint.x;
      const py = -waypoint.y;
      return { ...v, tx: 400 - px * v.scale, ty: 300 - py * v.scale };
    });
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
    <div className="h-full min-h-0 system-page">
      <div className={`system-layout ${railCompact ? "rail-compact" : ""}`}>
        <aside className={`waypoint-rail ${railOpen ? "is-open" : ""}`}>
          <div className="waypoint-rail-header">
            <div>
              <div className="map-detail-label">Navigator</div>
              {!railCompact ? <div className="map-detail-title mt-1">Waypoints</div> : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="waypoint-rail-toggle"
                onClick={() => setRailCompact((value) => !value)}
              >
                {railCompact ? "Expand" : "Compact"}
              </Button>
              <Button size="sm" variant="outline" className="waypoint-rail-close" onClick={() => setRailOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          {!railCompact ? (
            <div className="space-y-2.5">
              <input
                className="map-input"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search waypoint symbol"
              />

              <div className="grid grid-cols-2 gap-2">
                <select className="map-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="ALL">All types</option>
                  {waypointTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  className="map-select"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                >
                  <option value="symbol">Sort: Symbol</option>
                  <option value="type">Sort: Type</option>
                  <option value="distance">Sort: Distance</option>
                </select>
              </div>

              <div className="map-detail-value text-xs text-emerald-100/70">
                Showing {filteredWaypoints.length} / {waypointData.length} waypoints
              </div>
            </div>
          ) : (
            <div className="map-detail-value text-xs text-emerald-100/70">{filteredWaypoints.length} visible</div>
          )}

          <div className="waypoint-rail-list">
            {filteredWaypoints.length > 0 ? (
              filteredWaypoints.map((waypoint) => {
                const style = getWaypointStyle(waypoint.type);
                const isSelected = selected === waypoint.symbol;
                return (
                  <button
                    key={waypoint.symbol}
                    type="button"
                    className={`waypoint-row ${isSelected ? "is-selected" : ""} ${railCompact ? "is-compact" : ""}`}
                    onClick={() => {
                      setSelected(waypoint.symbol);
                      centerOnWaypoint(waypoint.symbol);
                      setRailOpen(false);
                    }}
                    title={waypoint.symbol}
                  >
                    <span className="waypoint-row-dot" style={{ background: style.fill, borderColor: style.stroke }} aria-hidden />
                    {!railCompact ? (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-emerald-50">{waypoint.symbol}</span>
                        <span className="block truncate text-[11px] text-emerald-100/65">{waypoint.type}</span>
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="map-detail-value text-sm">No waypoints match current filters.</div>
            )}
          </div>
        </aside>

        <section className="system-map-area">
          <button
            type="button"
            className={`system-rail-backdrop ${railOpen ? "is-open" : ""}`}
            onClick={() => setRailOpen(false)}
            aria-label="Close waypoint navigator"
          />

          <div className="system-toolbar">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{systemSymbol}</Badge>
              <Badge variant="neutral">{waypointData.length} waypoints</Badge>
              {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="system-rail-open-btn" onClick={() => setRailOpen(true)}>
                Waypoints
              </Button>
              <Button size="sm" variant="outline" onClick={() => centerOnWaypoint(selected)} disabled={!selectedWaypoint}>
                Center selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => setView(INITIAL_VIEW)}>
                Reset view
              </Button>
            </div>
          </div>

          <div className="system-map-frame">
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

                {waypointData.map((waypoint) => {
                  const style = getWaypointStyle(waypoint.type);
                  const isSelected = selected === waypoint.symbol;
                  const isVisible = filteredWaypointSymbols.has(waypoint.symbol);

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
                        opacity={isVisible ? 1 : 0.28}
                      />

                      <text
                        x={waypoint.x + style.radius + 3}
                        y={-waypoint.y + 4}
                        fontSize={10}
                        fill={isSelected ? "#d7ffee" : "#9fd9bd"}
                        opacity={isVisible ? 1 : 0.35}
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

          <div className="shrink-0 space-y-1 text-xs text-emerald-200/75">
            {waypoints.isLoading ? <div className="text-slate-300">Loading waypoints...</div> : null}
            {waypoints.isError ? <div className="text-rose-300">Failed to load waypoints.</div> : null}
            <div>Drag to pan, wheel to zoom, click nodes to inspect, use the navigator to jump quickly.</div>
          </div>
        </section>

        <aside className="map-detail-pane system-detail-pane flex min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="map-detail-label">Inspector</div>
              <div className="map-detail-title mt-1">Waypoint Detail</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => host.navigate(`/fleet?system=${encodeURIComponent(systemSymbol)}`)}>
              Fleet
            </Button>
          </div>

          {!selectedInFilters && selectedWaypoint ? (
            <div className="rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
              Selected waypoint is outside current filters.
            </div>
          ) : null}

          <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
            {selectedWaypoint ? (
              <>
                <div className="map-info-card">
                  <div className="map-detail-label">Overview</div>
                  <div className="map-detail-value mt-1 text-base font-semibold text-emerald-100">{selectedWaypoint.symbol}</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
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
                </div>

                <div className="map-info-card">
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

                <div className="map-info-card">
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

                <div className="map-info-card">
                  <div className="map-detail-label mb-2">Orbit Data</div>
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
                </div>

                <div className="space-y-2 rounded-md border border-emerald-300/20 bg-emerald-300/5 p-3">
                  <div className="map-detail-label">Operations</div>
                  <div className="map-detail-value text-xs text-emerald-100/70">Send ship to this waypoint (optional)</div>
                  {ships.isLoading ? <div className="map-detail-value">Loading ships...</div> : null}
                  {ships.isError ? <div className="text-sm text-rose-300">Failed to load ships.</div> : null}

                  {!ships.isLoading && !ships.isError ? (
                    shipsInSystem.length > 0 ? (
                      <>
                        <select
                          className="map-select"
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
                            sendShip.isPending || !selectedShipSymbol || selectedShip?.nav.waypointSymbol === selectedWaypoint.symbol
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

                <div className="space-y-2">
                  <div className="map-detail-label">Systems API actions</div>

                  <ApiDisclosure title="Get system" subtitle="GET /systems/{systemSymbol}">
                    <Button size="sm" variant="outline" disabled={systemDetail.isFetching} onClick={() => systemDetail.refetch()}>
                      {systemDetail.isFetching ? "Fetching..." : `Fetch ${systemSymbol}`}
                    </Button>
                    {systemDetail.isError ? <ApiErrorAlert error={systemDetail.error} /> : null}
                    {systemDetail.data ? <JsonPreview data={systemDetail.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="List waypoints (paged/filterable)" subtitle="GET /systems/{systemSymbol}/waypoints">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Page</div>
                        <Input
                          type="number"
                          min={1}
                          value={waypointsPage}
                          onChange={(e) => setWaypointsPage(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Limit (max 20)</div>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={waypointsLimit}
                          onChange={(e) => setWaypointsLimit(Math.max(1, Math.min(20, Number(e.target.value) || 10)))}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Type (optional)</div>
                        <Input value={waypointsType} onChange={(e) => setWaypointsType(e.target.value)} placeholder="PLANET" />
                      </label>
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Traits (optional)</div>
                        <Input
                          value={waypointsTraits}
                          onChange={(e) => setWaypointsTraits(e.target.value)}
                          placeholder="MARKETPLACE, SHIPYARD"
                        />
                      </label>
                    </div>

                    <Button size="sm" variant="outline" disabled={waypointsPaged.isFetching} onClick={() => waypointsPaged.refetch()}>
                      {waypointsPaged.isFetching ? "Fetching..." : "Fetch page"}
                    </Button>
                    {waypointsPaged.isError ? <ApiErrorAlert error={waypointsPaged.error} /> : null}
                    {waypointsPaged.data ? <JsonPreview data={waypointsPaged.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Get waypoint" subtitle="GET /systems/{systemSymbol}/waypoints/{waypointSymbol}">
                    <Button size="sm" variant="outline" disabled={waypointDetail.isFetching} onClick={() => waypointDetail.refetch()}>
                      {waypointDetail.isFetching ? "Fetching..." : `Fetch ${selectedWaypoint.symbol}`}
                    </Button>
                    {waypointDetail.isError ? <ApiErrorAlert error={waypointDetail.error} /> : null}
                    {waypointDetail.data ? <JsonPreview data={waypointDetail.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Market" subtitle="GET .../market">
                    <Button size="sm" variant="outline" disabled={market.isFetching} onClick={() => market.refetch()}>
                      {market.isFetching ? "Fetching..." : "Fetch market"}
                    </Button>
                    {market.isError ? <ApiErrorAlert error={market.error} /> : null}
                    {market.data ? <JsonPreview data={market.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Shipyard" subtitle="GET .../shipyard">
                    <Button size="sm" variant="outline" disabled={shipyard.isFetching} onClick={() => shipyard.refetch()}>
                      {shipyard.isFetching ? "Fetching..." : "Fetch shipyard"}
                    </Button>
                    {shipyard.isError ? <ApiErrorAlert error={shipyard.error} /> : null}
                    {shipyard.data ? <JsonPreview data={shipyard.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Jump gate" subtitle="GET .../jump-gate">
                    <Button size="sm" variant="outline" disabled={jumpGate.isFetching} onClick={() => jumpGate.refetch()}>
                      {jumpGate.isFetching ? "Fetching..." : "Fetch jump gate"}
                    </Button>
                    {jumpGate.isError ? <ApiErrorAlert error={jumpGate.error} /> : null}
                    {jumpGate.data ? <JsonPreview data={jumpGate.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Construction site" subtitle="GET .../construction">
                    <Button size="sm" variant="outline" disabled={constructionSite.isFetching} onClick={() => constructionSite.refetch()}>
                      {constructionSite.isFetching ? "Fetching..." : "Fetch construction"}
                    </Button>
                    {constructionSite.isError ? <ApiErrorAlert error={constructionSite.error} /> : null}
                    {constructionSite.data ? <JsonPreview data={constructionSite.data} /> : null}
                  </ApiDisclosure>

                  <ApiDisclosure title="Supply construction" subtitle="POST .../construction/supply">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1 col-span-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Ship symbol</div>
                        <Input value={supplyShipSymbol} onChange={(e) => setSupplyShipSymbol(e.target.value)} placeholder="DODO-1" />
                      </label>
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Trade symbol</div>
                        <Input
                          value={supplyTradeSymbol}
                          onChange={(e) => setSupplyTradeSymbol(e.target.value)}
                          placeholder="IRON_ORE"
                        />
                      </label>
                      <label className="space-y-1">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/70">Units</div>
                        <Input
                          type="number"
                          min={1}
                          value={supplyUnits}
                          onChange={(e) => setSupplyUnits(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                    </div>

                    <Button size="sm" variant="outline" disabled={supplyConstruction.isPending} onClick={() => supplyConstruction.mutate()}>
                      {supplyConstruction.isPending ? "Supplying..." : "Supply"}
                    </Button>
                    {supplyConstruction.isError ? <ApiErrorAlert error={supplyConstruction.error} /> : null}
                    {supplyConstruction.data ? <JsonPreview data={supplyConstruction.data} /> : null}
                  </ApiDisclosure>
                </div>

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
        </aside>
      </div>
    </div>
  );
}
