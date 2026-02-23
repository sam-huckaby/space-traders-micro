import type { HostApi } from "@deck/contracts";
import { createHttpClient } from "@deck/http";

const BASE_URL = "https://api.spacetraders.io/v2";
const PAGE_LIMIT = 20;
const MAX_PAGES = 5;

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
      const data = await getAllPages<{ symbol: string; x: number; y: number; type?: string }>(
        (page) => `/systems?page=${page}&limit=${PAGE_LIMIT}`,
        signal
      );
      return { data };
    },
    async listWaypoints(systemSymbol: string, signal?: AbortSignal) {
      const data = await getAllPages<{ symbol: string; type: string; x: number; y: number; traits?: Array<{ symbol: string }> }>(
        (page) => `/systems/${encodeURIComponent(systemSymbol)}/waypoints?page=${page}&limit=${PAGE_LIMIT}`,
        signal
      );
      return { data };
    }
  };
}
