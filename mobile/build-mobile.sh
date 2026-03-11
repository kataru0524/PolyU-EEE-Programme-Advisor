#!/bin/bash
# Build the Next.js app (static export) and sync to all Capacitor native projects.
# Usage:
#   ./build-mobile.sh            – sync both Android and iOS
#   ./build-mobile.sh android    – sync Android only
#   ./build-mobile.sh ios        – sync iOS only

set -e

PLATFORM=${1:-all}

echo "▶ Building Next.js static export..."
cd "$(dirname "$0")/../web"
npm run build

echo "▶ Syncing Capacitor..."
cd "$(dirname "$0")"

if [ "$PLATFORM" = "android" ]; then
  npx cap sync android
elif [ "$PLATFORM" = "ios" ]; then
  npx cap sync ios
else
  npx cap sync
fi

echo "✓ Done. Open the native project with:"
echo "  npx cap open android"
echo "  npx cap open ios"
