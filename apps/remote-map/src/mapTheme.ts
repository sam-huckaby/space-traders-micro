const FALLBACK_FILL = "#6ee7b7";
const FALLBACK_STROKE = "#d1fae5";

const WAYPOINT_TYPE_COLORS: Record<string, { fill: string; stroke: string; radius: number }> = {
  PLANET: { fill: "#67e8f9", stroke: "#cffafe", radius: 6 },
  GAS_GIANT: { fill: "#fca5a5", stroke: "#fee2e2", radius: 7 },
  MOON: { fill: "#c4b5fd", stroke: "#ede9fe", radius: 5 },
  ORBITAL_STATION: { fill: "#f9a8d4", stroke: "#fce7f3", radius: 5.5 },
  JUMP_GATE: { fill: "#22d3ee", stroke: "#a5f3fc", radius: 7.5 },
  ASTEROID_FIELD: { fill: "#a8a29e", stroke: "#e7e5e4", radius: 5 },
  ASTEROID: { fill: "#9ca3af", stroke: "#e5e7eb", radius: 4.75 },
  ENGINEERED_ASTEROID: { fill: "#84cc16", stroke: "#d9f99d", radius: 5.25 },
  ASTEROID_BASE: { fill: "#fb7185", stroke: "#ffe4e6", radius: 5.5 },
  NEBULA: { fill: "#a78bfa", stroke: "#ddd6fe", radius: 7 },
  DEBRIS_FIELD: { fill: "#94a3b8", stroke: "#e2e8f0", radius: 4.5 },
  GRAVITY_WELL: { fill: "#818cf8", stroke: "#c7d2fe", radius: 6.5 },
  ARTIFICIAL_GRAVITY_WELL: { fill: "#2dd4bf", stroke: "#99f6e4", radius: 6.5 },
  FUEL_STATION: { fill: "#fbbf24", stroke: "#fef3c7", radius: 5.25 }
};

const SYSTEM_TYPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  NEUTRON_STAR: { fill: "#a5f3fc", stroke: "#ecfeff" },
  RED_STAR: { fill: "#fb7185", stroke: "#ffe4e6" },
  ORANGE_STAR: { fill: "#fb923c", stroke: "#ffedd5" },
  BLUE_STAR: { fill: "#60a5fa", stroke: "#dbeafe" },
  YOUNG_STAR: { fill: "#fef08a", stroke: "#fef9c3" },
  WHITE_DWARF: { fill: "#e2e8f0", stroke: "#f8fafc" },
  BLACK_HOLE: { fill: "#111827", stroke: "#a78bfa" },
  HYPERGIANT: { fill: "#f472b6", stroke: "#fce7f3" },
  NEBULA: { fill: "#c084fc", stroke: "#f3e8ff" },
  UNSTABLE: { fill: "#f43f5e", stroke: "#ffe4e6" }
};

export function getWaypointStyle(type: string | undefined) {
  if (!type) {
    return { fill: FALLBACK_FILL, stroke: FALLBACK_STROKE, radius: 5 };
  }

  return WAYPOINT_TYPE_COLORS[type] ?? { fill: FALLBACK_FILL, stroke: FALLBACK_STROKE, radius: 5 };
}

export function getSystemStyle(type: string | undefined) {
  if (!type) {
    return { fill: FALLBACK_FILL, stroke: FALLBACK_STROKE };
  }

  return SYSTEM_TYPE_COLORS[type] ?? { fill: FALLBACK_FILL, stroke: FALLBACK_STROKE };
}

export const waypointLegend = Object.entries(WAYPOINT_TYPE_COLORS).map(([type, colors]) => ({
  type,
  ...colors
}));

export const systemLegend = Object.entries(SYSTEM_TYPE_COLORS).map(([type, colors]) => ({
  type,
  ...colors
}));
