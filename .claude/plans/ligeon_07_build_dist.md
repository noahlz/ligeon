# Plan: Packaging for Distribution

**Goal:** Build distributable for macOS (.dmg) and Windows (.exe)

---

## Actions to Complete

### 1. Verify electron-builder is installed

electron-builder was already installed in Phase 1 as a dev dependency. Verify:

```bash
npm list electron-builder
```

### 2. Verify Build Configuration

The build configuration was already created:
- `package.json` scripts are set up correctly
- `electron-builder.json` contains build configuration

**Note**: Build configuration is in `electron-builder.json` (already created in Phase 1), not inline in package.json.

### 3. Create app icon

- Prompt user to create 1024x1024 PNG image → location `resources/icons/icon-1024.png`
- Generate icon.icns (macOS):
  ```bash
  mkdir resources/icons/icon.iconset
  sips -z 16 16     resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_16x16.png
  sips -z 32 32     resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_32x32.png
  sips -z 64 64     resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_32x32@2x.png
  sips -z 128 128   resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_128x128.png
  sips -z 256 256   resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_256x256.png
  sips -z 512 512   resources/icons/icon-1024.png --out resources/icons/icon.iconset/icon_512x512.png
  iconutil -c icns resources/icons/icon.iconset -o resources/icons/icon.icns
  ```
- Generate icon.ico (Windows):
  ```bash
  convert resources/icons/icon-1024.png -define icon:auto-resize=256,48,32,16 resources/icons/icon.ico
  ```

### 4. Create DMG background (macOS only)

- Create 540x380 PNG image
- Save as `resources/dmg-background.png`

### 5. Create entitlements file (macOS only)

Create `resources/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
```

### 6. Build for your platform

**All platforms:**
```bash
npm run build
```

**Platform-specific builds (optional):**
```bash
# macOS only
npm run build:vite && npm run build:electron-ts && electron-builder --mac

# Windows only
npm run build:vite && npm run build:electron-ts && electron-builder --win
```

Output: `release/*.dmg`, `release/*.zip`, or `release/*.exe` depending on platform

### 8. Test installers (optional)

```bash
# macOS
open release/*.dmg

# Windows
release\*.exe
```

---

**Expected Build outputs:**
- Output directory: `release/` (configured in electron-builder.json)
- macOS: `.dmg` (installer) + `.zip` (portable)
- Windows: `.exe` installer + portable executable
