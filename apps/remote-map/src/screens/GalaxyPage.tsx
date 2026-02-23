import React, { useEffect, useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@deck/ui";
import { createMapApi } from "../api";
import { getSystemStyle, systemLegend } from "../mapTheme";

type Viewport = { tx: number; ty: number; scale: number };

const INITIAL_VIEW: Viewport = { tx: 400, ty: 300, scale: 1 };
const RINGS = [100, 200, 320, 460, 620, 800, 1000];

export default function GalaxyPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const [view, setView] = useState<Viewport>(INITIAL_VIEW);
  const [selected, setSelected] = useState<string | null>(null);
  const api = useMemo(() => createMapApi(getHost, setBackoffActive), [getHost]);

  const systems = useQuery({
    queryKey: ["systems"],
    queryFn: ({ signal }) => api.listSystems(signal),
    enabled: !!host?.getSession().token
  });

  useEffect(() => {
    if (!systems.data?.data.length) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(systems.data.data[0].symbol);
      return;
    }

    if (!systems.data.data.some((system) => system.symbol === selected)) {
      setSelected(systems.data.data[0].symbol);
    }
  }, [selected, systems.data]);

  const selectedSystem = systems.data?.data.find((system) => system.symbol === selected) ?? null;

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
              <filter id="galaxy-selection-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
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

              {systems.data?.data.map((system) => {
                const style = getSystemStyle(system.type);
                const isSelected = selected === system.symbol;

                return (
                  <g
                    key={system.symbol}
                    onClick={() => setSelected(system.symbol)}
                    onDoubleClick={() => host.navigate(`/map/system/${encodeURIComponent(system.symbol)}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {isSelected ? (
                      <circle
                        cx={system.x}
                        cy={-system.y}
                        r={11}
                        fill="none"
                        stroke="var(--color-radar-glow)"
                        strokeWidth={1.5}
                        filter="url(#galaxy-selection-glow)"
                      />
                    ) : null}

                    <circle
                      cx={system.x}
                      cy={-system.y}
                      r={isSelected ? 6.5 : 4.8}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={1.2}
                    />

                    <text
                      x={system.x + 8}
                      y={-system.y + 4}
                      fontSize={10}
                      fill={isSelected ? "#d7ffee" : "#9fd9bd"}
                      style={{ userSelect: "none" }}
                    >
                      {system.symbol}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="map-detail-pane flex min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="map-detail-title">System Detail</div>
            <Button size="sm" variant="outline" onClick={() => setView(INITIAL_VIEW)}>
              Reset view
            </Button>
          </div>

          {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}

          <div className="min-h-0 flex-1 space-y-4 overflow-auto pr-1">
            {selectedSystem ? (
              <>
                <div>
                  <div className="map-detail-label">Symbol</div>
                  <div className="map-detail-value mt-1 font-semibold text-emerald-100">{selectedSystem.symbol}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="map-detail-label">Type</div>
                    <div className="map-detail-value mt-1">{selectedSystem.type ?? "UNKNOWN"}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">Sector</div>
                    <div className="map-detail-value mt-1">{selectedSystem.sectorSymbol ?? "-"}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">X</div>
                    <div className="map-detail-value mt-1">{selectedSystem.x}</div>
                  </div>
                  <div>
                    <div className="map-detail-label">Y</div>
                    <div className="map-detail-value mt-1">{selectedSystem.y}</div>
                  </div>
                </div>

                <Button onClick={() => host.navigate(`/map/system/${encodeURIComponent(selectedSystem.symbol)}`)}>
                  Open system map
                </Button>

                <div>
                  <div className="map-detail-label mb-2">System Type Legend</div>
                  <div className="space-y-1.5">
                    {systemLegend.map((entry) => (
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
              <div className="map-detail-value">Select a star system in the map to inspect it.</div>
            )}
          </div>

          <div className="shrink-0 space-y-1 text-xs text-emerald-200/75">
            {systems.isLoading ? <div className="text-slate-300">Loading systems...</div> : null}
            {systems.isError ? <div className="text-rose-300">Failed to load systems.</div> : null}
            <div>Drag to pan, wheel to zoom, click to inspect, double-click to open system map.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
