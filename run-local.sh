#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "================================================================="
echo "   LEASH — VERIFIABLE AI PAYMENT AUTHORIZATION DEMO (LOCAL)     "
echo "================================================================="

# 1. Check or start TideCloak container on port 8180
echo "[1/3] Checking TideCloak dev container..."
if docker ps --filter "name=leash-tidecloak" --filter "status=running" | grep -q "leash-tidecloak"; then
  echo "  ✓ TideCloak container is already running at http://127.0.0.1:8180"
elif docker ps -a --filter "name=leash-tidecloak" | grep -q "leash-tidecloak"; then
  echo "  Starting existing TideCloak container (leash-tidecloak)..."
  docker start leash-tidecloak
  echo "  ✓ TideCloak container started."
else
  echo "  Creating and starting TideCloak container (leash-tidecloak) on port 8180..."
  docker run \
    --name leash-tidecloak \
    -d \
    -p 127.0.0.1:8180:8080 \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=Admin@123456 \
    tideorg/tidecloak-dev:latest
  echo "  ✓ TideCloak container started."
fi

# 2. Check or verify dependencies
echo "[2/3] Checking Node.js environment..."
node -v >/dev/null 2>&1 || { echo "Error: Node.js >= 20 is required."; exit 1; }

# 3. Start Leash HTTP Demo Server on port 8787
echo "[3/3] Starting Leash Interactive Web Server on port 8787..."
# Free port 8787 if occupied by previous run
if lsof -ti :8787 >/dev/null 2>&1; then
  echo "  Freeing occupied port 8787..."
  lsof -ti :8787 | xargs -r kill -9 2>/dev/null || true
  sleep 1
fi
echo ""
echo "================================================================="
echo "   READY! OPEN YOUR BROWSER TO ACCESS THE DEMO:                 "
echo "   👉 Web UI Demo:         http://localhost:8787                "
echo "   👉 TideCloak Realm:     http://localhost:8180/realms/rmit-hackathon-2026/tide-console/ "
echo "================================================================="
echo "Press Ctrl+C to stop the Leash server."
echo ""

# Launch browser if command exists (optional helper)
if which xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:8787" >/dev/null 2>&1 &
elif which open >/dev/null 2>&1; then
  open "http://localhost:8787" >/dev/null 2>&1 &
fi

exec node src/server.mjs
