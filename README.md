# SpaceTraders Command Deck

Microfrontend command deck for SpaceTraders built with Vite Module Federation.

## Apps and ports

- Host shell: `http://localhost:5173`
- Session remote: `http://localhost:5174`
- Fleet remote: `http://localhost:5175`
- Map remote: `http://localhost:5176`
- Contracts remote: `http://localhost:5177`
- Backend proxy: `http://localhost:5180`

All app servers use strict ports (`strictPort: true`) so federation URLs stay stable.

## Architecture

- Host owns the only shared state: `{ token, agentSummary }`
- Remotes own their own fetching/caching/state with local TanStack Query clients
- Cross-remote coordination is via routes and URL params
- See `AGENT.md` for the non-deviation architecture rules

## Prerequisites

- Node.js 20+
- Corepack enabled (recommended)

## Install

```bash
corepack pnpm install
```

## Environment setup

```bash
cp .env.example .env
```

Set `SPACETRADERS_ACCOUNT_TOKEN` in `.env`. The backend proxy uses this token to register new agents without exposing it in the browser.

## Run in dev

```bash
corepack pnpm dev
```

This starts host + remotes through Turbo.
Remotes run as `vite build --watch` + `vite preview`, so the first startup may take a few extra seconds.

Remote dev scripts set `VITE_REMOTE_BASE` per remote (`5174-5177`) so chunk and CSS preload URLs resolve to each remote origin instead of the host origin.

## Zephyr plugin mode

The Vite Zephyr plugin is wired in all federation configs, but is opt-in for local runs.

```bash
ZEPHYR_ENABLE=1 corepack pnpm dev
```

Without Zephyr auth/git setup, keep `ZEPHYR_ENABLE` unset (default) to avoid interactive auth prompts.

## Build

```bash
corepack pnpm build
```

## Typecheck

```bash
corepack pnpm typecheck
```

## Troubleshooting

- **Port already in use**
  - Because ports are strict, startup fails if any of `5173-5177` is occupied (or if `5180` is occupied for backend proxy).
  - Stop the process using that port, then rerun `corepack pnpm dev`.

- **Remote unavailable in host**
  - Ensure all remotes are running on their expected ports.
  - Host loads remote entries from:
    - `http://localhost:5174/remoteEntry.js`
    - `http://localhost:5175/remoteEntry.js`
    - `http://localhost:5176/remoteEntry.js`
    - `http://localhost:5177/remoteEntry.js`

- **Refresh shows `/assets/...` 404 from `localhost:5173`**
  - This means a remote's preload URLs are resolving against host origin instead of remote origin.
  - Make sure remote dev scripts include `VITE_REMOTE_BASE=http://localhost:<remote-port>/`.
  - Restart all dev servers after script/config updates.

- **Token issues after resets**
  - SpaceTraders resets can invalidate prior tokens.
  - Use Session screen to set a new token or register a new agent.

- **Register fails with backend token error**
  - Ensure `.env` exists at repo root and contains `SPACETRADERS_ACCOUNT_TOKEN`.
  - Restart dev servers after changing `.env`.

## Project layout

```text
apps/
  backend-proxy/
  host-shell/
  remote-session/
  remote-fleet/
  remote-map/
  remote-contracts/
packages/
  contracts/
  http/
  ui/
```
