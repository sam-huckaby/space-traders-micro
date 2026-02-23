import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2";

export function createFleetApi(getHost: () => HostApi | null, onBackoffChange: (active: boolean) => void) {
  const http = createHttpClient({
    baseUrl: BASE_URL,
    getToken: () => getHost()?.getSession().token ?? null,
    onBackoffChange
  });

  return {
    listShips(signal?: AbortSignal) {
      return http.request<{ data: Array<{ symbol: string; nav: { status: string; systemSymbol: string; waypointSymbol: string }; cargo: { units: number; capacity: number } }> }>(
        "/my/ships",
        { signal }
      );
    },
    getShip(shipSymbol: string, signal?: AbortSignal) {
      return http.request<{ data: { symbol: string; nav: { status: string; flightMode: string; systemSymbol: string; waypointSymbol: string }; cargo: { units: number; capacity: number; inventory: Array<{ symbol: string; units: number }> } } }>(
        `/my/ships/${encodeURIComponent(shipSymbol)}`,
        { signal }
      );
    }
  };
}
