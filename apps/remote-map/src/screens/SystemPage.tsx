import React, { useEffect, useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@deck/ui";
import { useParams, useSearchParams } from "react-router-dom";
import { createMapApi } from "../api";
import { getWaypointStyle, waypointLegend } from "../mapTheme";

type Viewport = { tx: number; ty: number; scale: number };

const INITIAL_VIEW: Viewport = { tx: 400, ty: 300, scale: 1 };
const RINGS = [70, 140, 220, 320, 430, 560, 720, 900, 1100];

export default function SystemPage({ getHost }: { getHost: () => HostApi | null }) {
  const { systemSymbol = "" } = useParams();
  const [search] = useSearchParams();
  const focusWaypoint = search.get("focusWaypoint");
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const [selected, setSelected] = useState<string | null>(focusWaypoint);
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
