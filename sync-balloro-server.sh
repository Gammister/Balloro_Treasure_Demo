#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h}"
TARGET_DIR="/Users/grigorydorin/Library/Application Support/Balloro X3000"
STAGING_DIR=$(/usr/bin/mktemp -d "/tmp/balloro-treasure-sync.XXXXXX")
trap '/bin/rm -rf "$STAGING_DIR"' EXIT HUP INT TERM

/usr/bin/rsync -a \
  --exclude ".git/" \
  --exclude ".gitignore" \
  --exclude "AGENTS.md" \
  --exclude "README.md" \
  --exclude "Docs/" \
  --exclude "MathOutput/" \
  --exclude "billiard.html" \
  --exclude "com.balloro.x3000.server.plist" \
  --exclude "sync-balloro-server.sh" \
  --exclude "math/build-*.js" \
  --exclude "math/export-*.js" \
  --exclude "math/load-trajectory-library.js" \
  --exclude "math/puck-luck-math.js" \
  --exclude "math/puck-luck-math-v2.js" \
  --exclude "math/run-*.js" \
  --exclude "math/simulate-*.js" \
  --exclude "math/test-*.js" \
  --exclude "math/field-generator-store.json" \
  --exclude "balloro-server.log" \
  --exclude "balloro-server-error.log" \
  "$SOURCE_DIR/" "$STAGING_DIR/"

mkdir -p "$TARGET_DIR"
/usr/bin/rsync -a --delete \
  --filter "protect math/field-generator-store.json" \
  "$STAGING_DIR/" "$TARGET_DIR/"

/bin/launchctl kickstart -k "gui/$(/usr/bin/id -u)/com.balloro.x3000.server"

for attempt in {1..30}; do
  if /usr/bin/curl -fsS --max-time 1 "http://127.0.0.1:8767/index.html" >/dev/null; then
    print "BalloroX server is ready: http://127.0.0.1:8767/index.html"
    exit 0
  fi
  /bin/sleep 0.2
done

print -u2 "BalloroX server did not become ready on port 8767"
exit 1
