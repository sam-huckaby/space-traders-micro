import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2";

export function createContractsApi(
  getHost: () => HostApi | null,
  onBackoffChange: (active: boolean) => void
) {
  const http = createHttpClient({
    baseUrl: BASE_URL,
    getToken: () => getHost()?.getSession().token ?? null,
    onBackoffChange
  });

  return {
    listContracts(signal?: AbortSignal) {
      return http.request<{ data: Array<{ id: string; factionSymbol: string; accepted: boolean; fulfilled: boolean; terms?: { deadline?: string } }> }>(
        "/my/contracts",
        { signal }
      );
    },
    getContract(id: string, signal?: AbortSignal) {
      return http.request<{ data: { id: string; factionSymbol: string; accepted: boolean; fulfilled: boolean; terms?: { deadline?: string; payment?: { onAccepted?: number; onFulfilled?: number } } } }>(
        `/my/contracts/${encodeURIComponent(id)}`,
        { signal }
      );
    }
  };
}
