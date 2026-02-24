import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2"; // pragma: allowlist secret
const PAGE_LIMIT = 20;
const MAX_PAGES = 5;

export type MapSystem = {
  symbol: string;
  sectorSymbol?: string;
  type?: string;
  x: number;
  y: number;
  waypoints?: Array<{ symbol: string; type: string; x: number; y: number }>;
  factions?: Array<{ symbol: string }>;
};

export type MapWaypointTrait = {
  symbol: string;
  name?: string;
  description?: string;
};

export type MapWaypointModifier = {
  symbol: string;
  name?: string;
  description?: string;
};

export type MapWaypoint = {
  symbol: string;
  type: string;
  x: number;
  y: number;
  systemSymbol?: string;
  orbits?: string;
  orbitals?: Array<{ symbol: string }>;
  faction?: { symbol: string };
  traits?: MapWaypointTrait[];
  modifiers?: MapWaypointModifier[];
  chart?: { waypointSymbol?: string; submittedBy?: string; submittedOn?: string };
  isUnderConstruction?: boolean;
};

export type MapShipNav = {
  status: string;
  systemSymbol: string;
  waypointSymbol: string;
  flightMode?: string;
  route?: {
    destination?: { symbol?: string; type?: string; systemSymbol?: string; x?: number; y?: number };
    arrival?: string;
  };
};

export type MapShip = {
  symbol: string;
  nav: MapShipNav;
};

export type MapNavigateShipResponse = {
  data: {
    nav?: MapShipNav;
    events?: Array<{ type?: string; symbol?: string }>;
  };
};

type Paginated<T> = {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export function createMapApi(getHost: () => HostApi | null, onBackoffChange: (active: boolean) => void) {
  const http = createHttpClient({
    baseUrl: BASE_URL,
    getToken: () => getHost()?.getSession().token ?? null,
    onBackoffChange
  });

  async function getAllPages<T>(buildPath: (page: number) => string, signal?: AbortSignal): Promise<T[]> {
    const all: T[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await http.request<Paginated<T>>(buildPath(page), { signal });
      const chunk = res.data ?? [];
      all.push(...chunk);

      const totalPages = res.meta?.totalPages;
      if (typeof totalPages === "number" && page >= totalPages) {
        break;
      }

      if (chunk.length < PAGE_LIMIT) {
        break;
      }
    }

    return all;
  }

  return {
    async listSystems(signal?: AbortSignal) {
      const data = await getAllPages<MapSystem>((page) => `/systems?page=${page}&limit=${PAGE_LIMIT}`, signal);
      return { data };
    },
    async listWaypoints(systemSymbol: string, signal?: AbortSignal) {
      const data = await getAllPages<MapWaypoint>(
        (page) => `/systems/${encodeURIComponent(systemSymbol)}/waypoints?page=${page}&limit=${PAGE_LIMIT}`,
        signal
      );
      return { data };
    },
    async listShips(signal?: AbortSignal) {
      const data = await getAllPages<MapShip>((page) => `/my/ships?page=${page}&limit=${PAGE_LIMIT}`, signal);
      return { data };
    },
    navigateShip(shipSymbol: string, waypointSymbol: string) {
      return http.request<MapNavigateShipResponse>(`/my/ships/${encodeURIComponent(shipSymbol)}/navigate`, {
        method: "POST",
        body: JSON.stringify({ waypointSymbol })
      });
    }
  };
}
