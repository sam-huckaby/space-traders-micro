import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotEnv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

loadDotEnv({ path: resolve(__dirname, "../../../.env") });

const port = Number(process.env.BACKEND_PROXY_PORT ?? "5180");
const apiBaseUrl = process.env.SPACETRADERS_API_BASE_URL ?? "https://api.spacetraders.io/v2";
const accountToken = process.env.SPACETRADERS_ACCOUNT_TOKEN;

type RegisterPayload = {
  symbol: string;
  faction?: string;
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  const allowed = new Set(["http://localhost:5173", "http://localhost:5174"]);
  if (origin && allowed.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw) as T;
}

function sanitizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function validateRegisterPayload(body: RegisterPayload) {
  const symbol = sanitizeSymbol(body.symbol ?? "");
  if (symbol.length < 3 || symbol.length > 14) {
    return { ok: false as const, message: "Agent symbol must be 3-14 characters." };
  }
  const faction = body.faction?.trim() || "COSMIC";
  return { ok: true as const, symbol, faction };
}

const server = createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/register") {
    json(res, 404, { error: "Not found" });
    return;
  }

  if (!accountToken) {
    json(res, 500, {
      error: "Missing SPACETRADERS_ACCOUNT_TOKEN on backend. Set it in .env."
    });
    return;
  }

  try {
    const body = await readJsonBody<RegisterPayload>(req);
    const payload = validateRegisterPayload(body);

    if (!payload.ok) {
      json(res, 400, { error: payload.message });
      return;
    }

    const upstream = await fetch(`${apiBaseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accountToken}`
      },
      body: JSON.stringify({ symbol: payload.symbol, faction: payload.faction })
    });

    const text = await upstream.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    json(res, upstream.status, data);
  } catch {
    json(res, 400, { error: "Invalid JSON payload." });
  }
});

server.listen(port, () => {
  console.log(`[backend-proxy] listening on http://localhost:${port}`);
});
