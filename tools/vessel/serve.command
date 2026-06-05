#!/bin/bash
# Vessel.2 — local dev server
# Double-click to start. Closes when you quit Terminal or Ctrl-C.

cd "$(dirname "$0")"

PORT=8000

# Find a free port if 8000 is taken
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

URL="http://localhost:$PORT/"

echo ""
echo "  OP/AL — VESSEL.2"
echo "  ────────────────────────────────────────"
echo "  Serving: $(pwd)"
echo "  URL:     $URL"
echo "  Stop:    Ctrl-C (or close this window)"
echo ""

# Open browser shortly after server starts
( sleep 1 && open "$URL" ) &

# Serve
python3 -m http.server "$PORT"
