# ligeon Part 8: Build & Distribution

**Goal:** Build installers for macOS (.dmg) and Windows (.exe)

---

## Actions to Complete

### 1. Install electron-builder

```bash
pnpm add -D electron-builder
```

### 2. Update package.json

Add to `package.json`:

```json
{
  "name": "ligeon",
  "version": "1.0.0",
  "license": "GPL-3.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"pnpm dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "pnpm build && electron-builder",
    "electron:build:mac": "pnpm build && electron-builder --mac",
    "electron:build:win": "pnpm build && electron-builder --win"
  },
  "build": {
    "appId": "io.github.ligeon",
    "productName": "ligeon",
    "directories": {
      "buildResources": "resources",
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "resources/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.games",
      "target": [{"target": "dmg", "arch": ["x64", "arm64"]}, {"target": "zip", "arch": ["x64", "arm64"]}],
      "icon": "resources/icons/icon.icns"
    },
    "dmg": {
      "contents": [{"x": 130, "y": 220}, {"x": 410, "y": 220, "type": "link", "path": "/Applications"}],
      "background": "resources/dmg-background.png",
      "window": {"width": 540, "height": 380}
    },
    "win": {
      "target": [{"target": "nsis", "arch": ["x64"]}, {"target": "portable", "arch": ["x64"]}],
      "icon": "resources/icons/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "license": "LICENSE"
    }
  }
}
```

### 3. Create app icon

- Create 1024x1024 PNG image → save as `resources/icons/icon-1024.png`
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

- Create 540x380 PNG image with your app icon/branding
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

### 6. Create LICENSE file

Copy existing GPL v3 license to `LICENSE` file in project root (already done at /Users/noahlz/projects/ligeon/LICENSE)

### 7. Build for your platform

**macOS:**
```bash
pnpm build
pnpm electron:build:mac
```
Output: `dist-electron/*.dmg` and `dist-electron/*.zip`

**Windows:**
```bash
pnpm build
pnpm electron:build:win
```
Output: `dist-electron/*.exe` (installer and portable)

### 8. Test installers (optional)

```bash
# macOS
open dist-electron/*.dmg

# Windows
dist-electron\*.exe
```

---

## Summary

**Completed:**
- electron-builder installed
- package.json configured with build scripts
- Icons created (icns, ico)
- DMG background created (macOS)
- Entitlements file created (macOS)
- LICENSE file in place
- Installers built (dmg/exe in dist-electron/)

**Build outputs:**
- macOS: `.dmg` (installer) + `.zip` (portable)
- Windows: `.exe` installer + portable executable

**Manually upload dist-electron/ files to your distribution platform (GitHub Releases, website, etc.)**
