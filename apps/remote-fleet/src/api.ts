import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2"; // pragma: allowlist secret
const PAGE_LIMIT = 20;
const MAX_PAGES = 5;

export type FleetShipFuel = {
  current: number;
  capacity: number;
  consumed?: { amount?: number; timestamp?: string };
};

export type FleetShipNav = {
  status: string;
  systemSymbol: string;
  waypointSymbol: string;
  flightMode?: string;
  route?: {
    departureTime?: string;
    arrival?: string;
    destination?: { symbol?: string; systemSymbol?: string; type?: string; x?: number; y?: number };
    departure?: { symbol?: string; systemSymbol?: string; type?: string; x?: number; y?: number };
  };
};

export type FleetShipCargo = {
  units: number;
  capacity: number;
  inventory?: Array<{ symbol: string; units: number; name?: string; description?: string }>;
};

export type FleetShip = {
  symbol: string;
  registration?: { name?: string; role?: string; factionSymbol?: string };
  nav: FleetShipNav;
  fuel?: FleetShipFuel;
  cargo: FleetShipCargo;
  crew?: { current: number; capacity: number; required?: number; rotation?: string; morale?: number; wages?: number };
  frame?: { symbol?: string; name?: string; description?: string; moduleSlots?: number; mountingPoints?: number; fuelCapacity?: number };
  reactor?: { symbol?: string; name?: string; description?: string; powerOutput?: number };
  engine?: { symbol?: string; name?: string; description?: string; speed?: number };
  modules?: Array<{ symbol: string; name?: string; description?: string; capacity?: number; range?: number }>;
  mounts?: Array<{ symbol: string; name?: string; description?: string; strength?: number }>;
};

export type PurchaseShipRequest = {
  shipType: string;
  waypointSymbol: string;
};

export type NavigateShipRequest = { waypointSymbol: string };
export type JumpShipRequest = { waypointSymbol: string };
export type WarpShipRequest = { waypointSymbol: string };

export type PatchShipNavRequest = { flightMode?: string };

export type TradeSymbolUnitsRequest = { symbol: string; units: number };
export type JettisonRequest = TradeSymbolUnitsRequest;
export type PurchaseCargoRequest = TradeSymbolUnitsRequest;
export type SellCargoRequest = TradeSymbolUnitsRequest;

export type RefuelShipRequest = { units?: number; fromCargo?: boolean };
export type RefineShipRequest = { produce: string };

export type TransferCargoRequest = { tradeSymbol: string; units: number; shipSymbol: string };

export type InstallRemoveRequest = { symbol: string };

export type ExtractResourcesRequest = { survey?: unknown };

type Paginated<T> = {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export function createFleetApi(getHost: () => HostApi | null, onBackoffChange: (active: boolean) => void) {
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

  function shipPath(shipSymbol: string) {
    return `/my/ships/${encodeURIComponent(shipSymbol)}`;
  }

  return {
    async listShips(signal?: AbortSignal) {
      const data = await getAllPages<FleetShip>((page) => `/my/ships?page=${page}&limit=${PAGE_LIMIT}`, signal);
      return { data };
    },
    getShip(shipSymbol: string, signal?: AbortSignal) {
      return http.request<{ data: FleetShip }>(shipPath(shipSymbol), { signal });
    },

    purchaseShip(payload: PurchaseShipRequest) {
      return http.request<unknown>("/my/ships", { method: "POST", body: JSON.stringify(payload) });
    },

    getShipCargo(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/cargo`, { signal });
    },
    getShipNav(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/nav`, { signal });
    },
    patchShipNav(shipSymbol: string, payload: PatchShipNavRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/nav`, { method: "PATCH", body: JSON.stringify(payload) });
    },

    orbitShip(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/orbit`, { method: "POST" });
    },
    dockShip(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/dock`, { method: "POST" });
    },

    navigateShip(shipSymbol: string, payload: NavigateShipRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/navigate`, { method: "POST", body: JSON.stringify(payload) });
    },
    warpShip(shipSymbol: string, payload: WarpShipRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/warp`, { method: "POST", body: JSON.stringify(payload) });
    },
    jumpShip(shipSymbol: string, payload: JumpShipRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/jump`, { method: "POST", body: JSON.stringify(payload) });
    },

    refuelShip(shipSymbol: string, payload?: RefuelShipRequest) {
      const body = payload && Object.keys(payload).length ? JSON.stringify(payload) : undefined;
      return http.request<unknown>(`${shipPath(shipSymbol)}/refuel`, { method: "POST", ...(body ? { body } : {}) });
    },

    purchaseCargo(shipSymbol: string, payload: PurchaseCargoRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/purchase`, { method: "POST", body: JSON.stringify(payload) });
    },
    sellCargo(shipSymbol: string, payload: SellCargoRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/sell`, { method: "POST", body: JSON.stringify(payload) });
    },
    transferCargo(shipSymbol: string, payload: TransferCargoRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/transfer`, { method: "POST", body: JSON.stringify(payload) });
    },
    jettison(shipSymbol: string, payload: JettisonRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/jettison`, { method: "POST", body: JSON.stringify(payload) });
    },

    createChart(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/chart`, { method: "POST" });
    },

    scanShips(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/scan/ships`, { method: "POST" });
    },
    scanSystems(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/scan/systems`, { method: "POST" });
    },
    scanWaypoints(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/scan/waypoints`, { method: "POST" });
    },

    getShipCooldown(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/cooldown`, { signal });
    },
    createSurvey(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/survey`, { method: "POST" });
    },
    extractResources(shipSymbol: string, payload?: ExtractResourcesRequest) {
      const body = payload && Object.keys(payload).length ? JSON.stringify(payload) : undefined;
      return http.request<unknown>(`${shipPath(shipSymbol)}/extract`, { method: "POST", ...(body ? { body } : {}) });
    },
    extractResourcesWithSurvey(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/extract/survey`, { method: "POST" });
    },
    siphonResources(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/siphon`, { method: "POST" });
    },
    refineShip(shipSymbol: string, payload: RefineShipRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/refine`, { method: "POST", body: JSON.stringify(payload) });
    },

    negotiateContract(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/negotiate/contract`, { method: "POST" });
    },

    getMounts(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/mounts`, { signal });
    },
    installMount(shipSymbol: string, payload: InstallRemoveRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/mounts/install`, { method: "POST", body: JSON.stringify(payload) });
    },
    removeMount(shipSymbol: string, payload: InstallRemoveRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/mounts/remove`, { method: "POST", body: JSON.stringify(payload) });
    },

    getModules(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/modules`, { signal });
    },
    installModule(shipSymbol: string, payload: InstallRemoveRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/modules/install`, { method: "POST", body: JSON.stringify(payload) });
    },
    removeModule(shipSymbol: string, payload: InstallRemoveRequest) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/modules/remove`, { method: "POST", body: JSON.stringify(payload) });
    },

    getRepairQuote(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/repair`, { signal });
    },
    repairShip(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/repair`, { method: "POST" });
    },

    getScrapQuote(shipSymbol: string, signal?: AbortSignal) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/scrap`, { signal });
    },
    scrapShip(shipSymbol: string) {
      return http.request<unknown>(`${shipPath(shipSymbol)}/scrap`, { method: "POST" });
    }
  };
}
