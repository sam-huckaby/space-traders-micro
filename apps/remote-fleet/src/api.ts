import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2"; // pragma: allowlist secret

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

export function createFleetApi(getHost: () => HostApi | null, onBackoffChange: (active: boolean) => void) {
  const http = createHttpClient({
    baseUrl: BASE_URL,
    getToken: () => getHost()?.getSession().token ?? null,
    onBackoffChange
  });

  return {
    listShips(signal?: AbortSignal) {
      return http.request<{ data: FleetShip[] }>("/my/ships", { signal });
    },
    getShip(shipSymbol: string, signal?: AbortSignal) {
      return http.request<{ data: FleetShip }>(`/my/ships/${encodeURIComponent(shipSymbol)}`, { signal });
    }
  };
}
