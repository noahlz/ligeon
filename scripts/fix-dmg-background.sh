#!/usr/bin/env bash
# Hides the .background.tiff file inside DMG installers.
# electron-builder fails to set this attribute on newer macOS versions.
set -euo pipefail

# Only process the DMG matching the current version's artifact name pattern
dmg=$(ls -t release/ligeon-*-installer-*.dmg 2>/dev/null | head -1)
if [ -z "$dmg" ]; then
  echo "No installer DMG found in release/"
  exit 0
fi

echo "Fixing: $dmg"
rw_dmg="${dmg%.dmg}-rw.dmg"

# Convert to read-write
hdiutil convert "$dmg" -format UDRW -o "$rw_dmg" -quiet

# Mount read-write copy and capture the mount point
mount_output=$(hdiutil attach "$rw_dmg" -readwrite -nobrowse -noautoopen)
mount_point=$(echo "$mount_output" | grep -o '/Volumes/.*' | head -1)

if [ -z "$mount_point" ]; then
  echo "  Error: could not determine mount point"
  rm -f "$rw_dmg"
  exit 1
fi

echo "  Mounted: $mount_point"

# Hide background tiff
if [ -f "$mount_point/.background.tiff" ]; then
  chflags hidden "$mount_point/.background.tiff"
  echo "  Hidden: .background.tiff"
else
  echo "  No .background.tiff found (already hidden or absent)"
fi

# Unmount
hdiutil detach "$mount_point" -quiet

# Convert back to compressed read-only, replacing original
rm "$dmg"
hdiutil convert "$rw_dmg" -format UDZO -o "$dmg" -quiet
rm "$rw_dmg"

echo "  Done: $dmg"
