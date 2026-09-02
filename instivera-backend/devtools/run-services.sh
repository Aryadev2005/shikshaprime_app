#!/usr/bin/env bash
# Start the seven services the mobile app touches, plus the local gateway.
#
# Each service reads its own .env.development (NODE_ENV=development), which is
# where its SERVICE_PORT and DB credentials live. They all point at the shared
# dev database — see devtools/README.md before creating test data.
#
#   ./devtools/run-services.sh          # start everything
#   ./devtools/run-services.sh stop     # stop everything
#   ./devtools/run-services.sh status   # what is listening
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS="$ROOT/devtools/logs"
PIDS="$LOGS/pids"

# service:port — ports must match each .env.development SERVICE_PORT.
SERVICES=(
  "identity-service:9050"
  "student-service:9051"
  "teacher-service:9052"
  "payment-service:9053"
  "chat-service:9054"
  "admission-service:9041"
  "fees-management-service:9059"
)

stop_all() {
  if [ -f "$PIDS" ]; then
    while read -r pid name; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && echo "stopped $name (pid $pid)"
      fi
    done < "$PIDS"
    rm -f "$PIDS"
  fi
  # tsx spawns a child; sweep anything still holding our ports.
  for entry in "${SERVICES[@]}"; do
    port="${entry##*:}"
    lsof -ti tcp:"$port" 2>/dev/null | xargs -r kill 2>/dev/null
  done
  lsof -ti tcp:4000 2>/dev/null | xargs -r kill 2>/dev/null
  echo "all stopped"
}

status() {
  printf "%-32s %-7s %s\n" SERVICE PORT STATE
  for entry in "${SERVICES[@]}"; do
    name="${entry%%:*}"; port="${entry##*:}"
    if lsof -ti tcp:"$port" >/dev/null 2>&1; then state="listening"; else state="-"; fi
    printf "%-32s %-7s %s\n" "$name" "$port" "$state"
  done
  if lsof -ti tcp:4000 >/dev/null 2>&1; then s=listening; else s=-; fi
  printf "%-32s %-7s %s\n" "gateway" "4000" "$s"
}

case "${1:-start}" in
  stop)   stop_all; exit 0 ;;
  status) status;   exit 0 ;;
esac

mkdir -p "$LOGS"
: > "$PIDS"

for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"; port="${entry##*:}"

  if [ ! -d "$ROOT/$name/node_modules" ]; then
    echo "SKIP $name — no node_modules (run: cd $name && npm install)"
    continue
  fi
  if [ ! -f "$ROOT/$name/.env.development" ]; then
    echo "SKIP $name — no .env.development"
    continue
  fi

  (cd "$ROOT/$name" && NODE_ENV=development npm run dev >"$LOGS/$name.log" 2>&1) &
  echo "$! $name" >> "$PIDS"
  echo "started $name -> :$port  (log: devtools/logs/$name.log)"
done

(cd "$ROOT" && node devtools/gateway.js >"$LOGS/gateway.log" 2>&1) &
echo "$! gateway" >> "$PIDS"
echo "started gateway -> :4000  (log: devtools/logs/gateway.log)"

echo
echo "Services need ~15s to connect to the DB. Then:"
echo "  ./devtools/run-services.sh status"
echo "  curl -s localhost:4000/api/identity/institutions -H 'x-tenant: collegea'"
