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

type ApiData<T> = {
  data: T;
};

export type SystemMarket = {
  symbol: string;
  exports?: Array<{ symbol: string; name?: string; description?: string }>;
  imports?: Array<{ symbol: string; name?: string; description?: string }>;
  exchange?: Array<{ symbol: string; name?: string; description?: string }>;
  tradeGoods?: Array<{
    symbol: string;
    type?: string;
    tradeVolume?: number;
    supply?: string;
    purchasePrice?: number;
    sellPrice?: number;
  }>;
};

export type SystemShipyard = {
  symbol: string;
  shipTypes?: Array<{ type: string }>;
  ships?: unknown[];
  modificationsFee?: number;
};

export type SystemJumpGate = {
  symbol: string;
  connections?: string[];
};

export type SystemConstruction = {
  symbol: string;
  materials?: Array<{ tradeSymbol: string; required: number; fulfilled: number }>;
  isComplete?: boolean;
};

export type SupplyConstructionResponse = {
  data: {
    construction: SystemConstruction;
    cargo: unknown;
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
    listSystemsPage(opts: { page: number; limit: number }, signal?: AbortSignal) {
      const page = Math.max(1, Math.floor(opts.page));
      const limit = Math.max(1, Math.min(20, Math.floor(opts.limit)));
      return http.request<Paginated<MapSystem>>(`/systems?page=${page}&limit=${limit}`, { signal });
    },
    getSystem(systemSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<MapSystem>>(`/systems/${encodeURIComponent(systemSymbol)}`, { signal });
    },
    async listWaypoints(systemSymbol: string, signal?: AbortSignal) {
      const data = await getAllPages<MapWaypoint>(
        (page) => `/systems/${encodeURIComponent(systemSymbol)}/waypoints?page=${page}&limit=${PAGE_LIMIT}`,
        signal
      );
      return { data };
    },
    listWaypointsPage(
      systemSymbol: string,
      opts: { page: number; limit: number; type?: string; traits?: string[] },
      signal?: AbortSignal
    ) {
      const page = Math.max(1, Math.floor(opts.page));
      const limit = Math.max(1, Math.min(20, Math.floor(opts.limit)));
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeof opts.type === "string" && opts.type.trim().length > 0) {
        params.set("type", opts.type.trim());
      }
      if (Array.isArray(opts.traits) && opts.traits.length > 0) {
        for (const trait of opts.traits) {
          if (typeof trait === "string" && trait.trim().length > 0) {
            params.append("traits", trait.trim());
          }
        }
      }
      return http.request<Paginated<MapWaypoint>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints?${params.toString()}`,
        { signal }
      );
    },
    getWaypoint(systemSymbol: string, waypointSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<MapWaypoint>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}`,
        { signal }
      );
    },
    getMarket(systemSymbol: string, waypointSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<SystemMarket>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}/market`,
        { signal }
      );
    },
    getShipyard(systemSymbol: string, waypointSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<SystemShipyard>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}/shipyard`,
        { signal }
      );
    },
    getJumpGate(systemSymbol: string, waypointSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<SystemJumpGate>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}/jump-gate`,
        { signal }
      );
    },
    getConstruction(systemSymbol: string, waypointSymbol: string, signal?: AbortSignal) {
      return http.request<ApiData<SystemConstruction>>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}/construction`,
        { signal }
      );
    },
    supplyConstruction(systemSymbol: string, waypointSymbol: string, body: { shipSymbol: string; tradeSymbol: string; units: number }) {
      return http.request<SupplyConstructionResponse>(
        `/systems/${encodeURIComponent(systemSymbol)}/waypoints/${encodeURIComponent(waypointSymbol)}/construction/supply`,
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );
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
