#!/bin/bash
# House Dismantle  Static Model Check
# Run before committing changes to house-*.js files.
# Detects known anti-patterns that pass validation but produce wrong geometry.

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
MODEL_DIR="$DIR/.."

echo "🔍 House Dismantle  Static Model Check"
echo ""

FAIL=0

# Rule 1: .add().position.set() anti-pattern
# Three.js Object3D.add() returns the PARENT (group), so chaining .position.set()
# moves the entire group instead of positioning the child mesh.
echo "  [1/3] Checking for .add().position.set() anti-pattern..."
MATCHES=$(grep -rn '\.add(box.*)\.position\.set\|\.add(new.*)\.position\.set' "$MODEL_DIR" --include='*.js' || true)
if [ -n "$MATCHES" ]; then
  echo "  ❌ FAIL: Found .add().position.set()  moves group, not mesh:"
  echo "$MATCHES" | while read line; do
    echo "       $line"
  done
  echo "       Fix: const m = box(...); m.position.set(...); group.add(m);"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# Rule 2: Direct group.position mutation
# Part groups should stay at origin. Look for suspicious patterns.
echo "  [2/3] Checking for part group position mutation..."
MATCHES=$(grep -rn "parts\.get.*\.group\.position\." "$MODEL_DIR" || true)
if [ -n "$MATCHES" ]; then
  echo "  ⚠️  WARNING: Found group.position mutation:"
  echo "$MATCHES" | while read line; do
    echo "       $line"
  done
  echo "       Part groups should stay at world origin (0,0,0)."
else
  echo "  ✅ PASS"
fi

# Rule 3: Missing addTo before group.add
# Meshes must be registered via addTo(name, mesh) for validation to see them.
echo "  [3/3] Checking for group.add() without addTo()..."
# This is heuristic: find files where group.add() count > addTo() count
for f in "$MODEL_DIR"/floor1/walls.js "$MODEL_DIR"/floor1/floor.js "$MODEL_DIR"/floor1/openings.js "$MODEL_DIR"/floor2/walls.js "$MODEL_DIR"/floor2/floor.js "$MODEL_DIR"/floor2/openings.js "$MODEL_DIR"/roof/index.js "$MODEL_DIR"/base/index.js; do
  [ -f "$f" ] || continue
  ADD_COUNT=$(grep -c '\.add(' "$f" 2>/dev/null || echo 0)
  ADDTO_COUNT=$(grep -c 'addTo(' "$f" 2>/dev/null || echo 0)
  if [ "$ADD_COUNT" -gt "$ADDTO_COUNT" ]; then
    diff=$((ADD_COUNT - ADDTO_COUNT))
    echo "  ⚠️  $f: $ADD_COUNT group.add() vs $ADDTO_COUNT addTo() (gap: $diff)"
    echo "       Some meshes may not be registered for validation/raycasting."
  fi
done
echo "  ✅ heuristic check done"

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "❌ Static check FAILED. Fix issues above before committing."
  exit 1
else
  echo "✅ Static check PASSED."
fi
