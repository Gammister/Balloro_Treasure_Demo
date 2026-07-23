#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${0:A:h}"
TARGET_DIR="/Users/grigorydorin/Library/Application Support/Balloro Treasure"
SERVICE_LABEL="com.balloro.treasure.server"
LAUNCH_AGENT_DIR="/Users/grigorydorin/Library/LaunchAgents"
PLIST_SOURCE="$SOURCE_DIR/com.balloro.treasure.server.plist"
PLIST_TARGET="$LAUNCH_AGENT_DIR/com.balloro.treasure.server.plist"
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
  --exclude "com.balloro.treasure.server.plist" \
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

mkdir -p "$TARGET_DIR/math"
if [[ ! -f "$TARGET_DIR/math/field-generator-store.json" ]]; then
  /bin/cp "$SOURCE_DIR/math/field-generator-store.json" "$TARGET_DIR/math/field-generator-store.json"
fi
/usr/bin/rsync -a --delete \
  --filter "protect math/field-generator-store.json" \
  "$STAGING_DIR/" "$TARGET_DIR/"

mkdir -p "$LAUNCH_AGENT_DIR"
if [[ ! -f "$PLIST_TARGET" ]] || ! /usr/bin/cmp -s "$PLIST_SOURCE" "$PLIST_TARGET"; then
  if /bin/launchctl print "gui/$(/usr/bin/id -u)/$SERVICE_LABEL" >/dev/null 2>&1; then
    /bin/launchctl bootout "gui/$(/usr/bin/id -u)/$SERVICE_LABEL"
  fi
  /bin/cp "$PLIST_SOURCE" "$PLIST_TARGET"
fi

if /bin/launchctl print "gui/$(/usr/bin/id -u)/$SERVICE_LABEL" >/dev/null 2>&1; then
  /bin/launchctl kickstart -k "gui/$(/usr/bin/id -u)/$SERVICE_LABEL"
else
  /bin/launchctl bootstrap "gui/$(/usr/bin/id -u)" "$PLIST_TARGET"
fi

for attempt in {1..30}; do
  if /usr/bin/curl -fsS --max-time 1 "http://127.0.0.1:8768/index.html" >/dev/null; then
    print "Balloro Treasure server is ready: http://127.0.0.1:8768/index.html"
    exit 0
  fi
  /bin/sleep 0.2
done

print -u2 "Balloro Treasure server did not become ready on port 8768"
exit 1
