export type HttpError = {
  status: number;
  message: string;
  body?: unknown;
};

export type HttpClientOptions = {
  baseUrl: string;
  getToken: () => string | null;
  maxRetries?: number;
  initialBackoffMs?: number;
  onBackoffChange?: (active: boolean) => void;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createHttpClient(opts: HttpClientOptions) {
  const maxRetries = opts.maxRetries ?? 4;
  const initialBackoffMs = opts.initialBackoffMs ?? 400;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let attempt = 0;
    let backoff = initialBackoffMs;

    while (true) {
      const token = opts.getToken();
      const res = await fetch(`${opts.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {})
        }
      });

      if (res.status === 429 && attempt < maxRetries) {
        opts.onBackoffChange?.(true);
        const jitter = Math.floor(Math.random() * 150);
        await sleep(backoff + jitter);
        attempt += 1;
        backoff *= 2;
        continue;
      }

      opts.onBackoffChange?.(false);

      if (!res.ok) {
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = undefined;
        }
        const err: HttpError = {
          status: res.status,
          message: `HTTP ${res.status} for ${path}`,
          body
        };
        throw err;
      }

      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    }
  }

  return { request };
}
