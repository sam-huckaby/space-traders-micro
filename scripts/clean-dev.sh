#!/usr/bin/env bash
set -euo pipefail

PORTS=(5173 5174 5175 5176 5177 5180)

echo "Cleaning local dev processes..."

for port in "${PORTS[@]}"; do
  pids="$(lsof -ti tcp:"${port}" -sTCP:LISTEN || true)"
  if [[ -n "${pids}" ]]; then
    echo "- Stopping listeners on :${port} (${pids//$'\n'/, })"
    kill ${pids} 2>/dev/null || true
  fi
done

for pattern in "vite build --watch" "vite preview --port 5174" "vite preview --port 5175" "vite preview --port 5176" "vite preview --port 5177" "tsx watch src/server.ts" "turbo dev"; do
  pkill -f "${pattern}" 2>/dev/null || true
done

sleep 1

for port in "${PORTS[@]}"; do
  pids="$(lsof -ti tcp:"${port}" -sTCP:LISTEN || true)"
  if [[ -n "${pids}" ]]; then
    echo "- Force killing listeners on :${port} (${pids//$'\n'/, })"
    kill -9 ${pids} 2>/dev/null || true
  fi
done

echo "Done. Ports 5173-5180 are ready if no listeners are shown below:"
for port in "${PORTS[@]}"; do
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN || true
done
