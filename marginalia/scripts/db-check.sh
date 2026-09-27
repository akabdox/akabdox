#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres 16 and runs the smoke test.
# Needs the Postgres 16 server binaries (initdb, pg_ctl) on this machine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
WORK="$(mktemp -d)"
PORT="${PG_PORT:-54329}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$WORK"
  RUN_AS=(runuser -u postgres --)
fi

cleanup() { "${RUN_AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUN_AS[@]}" "$BIN/initdb" -D "$WORK/data" -U postgres --auth=trust >/dev/null
"${RUN_AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w start >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -o /dev/null)
"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase-stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  # pg_cron is a Supabase extension; the stub provides cron.schedule instead.
  grep -v 'create extension if not exists pg_cron' "$f" | "${PSQL[@]}"
done
echo "test     smoke.sql"
"${PSQL[@]}" -f "$ROOT/supabase/tests/smoke.sql"
echo "ok"
