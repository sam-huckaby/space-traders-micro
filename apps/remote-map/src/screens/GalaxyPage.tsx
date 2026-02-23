import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@deck/ui";
import { createMapApi } from "../api";

export default function GalaxyPage({ getHost }: { getHost: () => HostApi | null }) {
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const [view, setView] = useState({ tx: 400, ty: 300, scale: 1 });
  const api = useMemo(() => createMapApi(getHost, setBackoffActive), [getHost]);

  const systems = useQuery({
    queryKey: ["systems"],
    queryFn: ({ signal }) => api.listSystems(signal),
    enabled: !!host?.getSession().token
  });

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const next = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({ ...v, scale: Math.max(0.2, Math.min(5, v.scale * next)) }));
  }

  function onDrag(e: React.MouseEvent<SVGSVGElement>) {
    if (e.buttons !== 1) return;
    setView((v) => ({ ...v, tx: v.tx + e.movementX, ty: v.ty + e.movementY }));
  }

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Galaxy</h2>
        {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
      </div>

      <svg
        className="deck-map"
        width="100%"
        height="680"
        viewBox="0 0 800 600"
        onWheel={onWheel}
        onMouseMove={onDrag}
      >
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          <line x1={-10000} y1={0} x2={10000} y2={0} stroke="#1e293b" />
          <line x1={0} y1={-10000} x2={0} y2={10000} stroke="#1e293b" />
          {systems.data?.data.map((s) => (
            <g
              key={s.symbol}
              onClick={() => host.navigate(`/map/system/${encodeURIComponent(s.symbol)}`)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={s.x} cy={-s.y} r={5} fill="#22d3ee" />
              <text x={s.x + 8} y={-s.y + 4} fontSize={10} fill="#cbd5e1">
                {s.symbol}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {systems.isLoading ? <div className="text-slate-300">Loading systems...</div> : null}
      {systems.isError ? <div className="text-rose-300">Failed to load systems.</div> : null}
      <div className="text-xs text-slate-400">Drag to pan, wheel to zoom.</div>
    </div>
  );
}
