# ligeon Part 8: Build & Distribution

**Goal:** Build installers for macOS (.dmg) and Windows (.exe), code sign, release

---

## Actions to Complete

### 1. Install Build Dependencies

Install electron-builder and related dependencies:

```bash
npm install --save-dev electron-builder
npm install --save-dev dmg-license  # For macOS license agreement
npm install --save-dev @electron/notarize  # For macOS notarization
```

**Checklist:**
- [ ] Install electron-builder
- [ ] Install dmg-license (macOS)
- [ ] Install @electron/notarize (macOS)

---

### 2. Configure package.json Build Scripts

Update `package.json`:

```json
{
  "name": "chess-pgn-viewer",
  "version": "1.0.0",
  "description": "A lightweight chess PGN database browser",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:all": "npm run build && electron-builder --mac --win",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "postinstall": "electron-builder install-app-deps"
  },
  "build": {
    "appId": "com.yourcompany.chess-pgn-viewer",
    "productName": "Chess PGN Viewer",
    "copyright": "Copyright © 2025 ${author}",
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
    "extraResources": [
      {
        "from": "resources/sample-games",
        "to": "sample-games",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.games",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "resources/icons/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "resources/entitlements.mac.plist",
      "entitlementsInherit": "resources/entitlements.mac.plist"
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ],
      "background": "resources/dmg-background.png",
      "window": {
        "width": 540,
        "height": 380
      }
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "resources/icons/icon.ico",
      "publisherName": "Your Company Name",
      "verifyUpdateCodeSignature": false
    },
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Chess PGN Viewer",
      "installerIcon": "resources/icons/icon.ico",
      "uninstallerIcon": "resources/icons/icon.ico",
      "installerHeaderIcon": "resources/icons/icon.ico",
      "license": "LICENSE"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Game",
      "icon": "resources/icons"
    }
  }
}
```

**Checklist:**
- [ ] Update package.json with build configuration
- [ ] Set correct appId (reverse DNS notation)
- [ ] Update author and company information
- [ ] Verify build scripts are correct

---

### 3. Create Application Icons

You need icons in multiple formats:

### macOS Icon (.icns)

**Requirements:**
- 1024x1024 PNG source image
- Convert to .icns format

**Using iconutil (macOS):**

```bash
# Create icon set folder
mkdir resources/icons/icon.iconset

# Generate all sizes (requires ImageMagick or sips)
sips -z 16 16     icon-1024.png --out resources/icons/icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out resources/icons/icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out resources/icons/icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out resources/icons/icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out resources/icons/icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out resources/icons/icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out resources/icons/icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out resources/icons/icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out resources/icons/icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out resources/icons/icon.iconset/icon_512x512@2x.png

# Convert to .icns
iconutil -c icns resources/icons/icon.iconset -o resources/icons/icon.icns
```

### Windows Icon (.ico)

**Requirements:**
- Multiple sizes: 16x16, 32x32, 48x48, 256x256
- .ico format

**Using ImageMagick:**

```bash
convert icon-1024.png -define icon:auto-resize=256,48,32,16 resources/icons/icon.ico
```

### Linux Icons

**Requirements:**
- PNG files in standard sizes
- Place in resources/icons/

```bash
mkdir -p resources/icons
cp icon-16.png resources/icons/16x16.png
cp icon-32.png resources/icons/32x32.png
cp icon-48.png resources/icons/48x48.png
cp icon-128.png resources/icons/128x128.png
cp icon-256.png resources/icons/256x256.png
cp icon-512.png resources/icons/512x512.png
```

**Checklist:**
- [ ] Design 1024x1024 app icon
- [ ] Generate icon.icns (macOS)
- [ ] Generate icon.ico (Windows)
- [ ] Generate PNG icons (Linux)
- [ ] Place icons in resources/icons/

---

### 4. Create DMG Background (macOS)

**File: `resources/dmg-background.png`**

**Specifications:**
- Size: 540x380 pixels
- 72 DPI
- Format: PNG with transparency
- Content: Your app icon, branding, "Drag to Applications" arrow

**Design Tips:**
- Keep it simple and professional
- Use your brand colors
- Include visual cues for installation

**Checklist:**
- [ ] Design DMG background image (540x380)
- [ ] Save as resources/dmg-background.png
- [ ] Test DMG appearance after build

---

### 5. Create Entitlements File (macOS)

**File: `resources/entitlements.mac.plist`**

Required for macOS notarization and hardened runtime:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
```

**Explanation:**
- `allow-jit`: Required for V8 engine (Node.js/Electron)
- `allow-unsigned-executable-memory`: Required for certain native modules
- `network.client`: Required for Lichess integration (opening URLs)
- `files.user-selected.read-write`: Required for PGN file selection

**Checklist:**
- [ ] Create resources/entitlements.mac.plist
- [ ] Verify entitlements are correct for your app's needs

---

### 6. Create LICENSE File

**File: `LICENSE`**

Choose a license (MIT is common for open-source projects):

```
MIT License

Copyright (c) 2025 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Checklist:**
- [ ] Choose appropriate license
- [ ] Create LICENSE file in project root
- [ ] Update copyright year and name

---

### 7. Code Signing (macOS) - Optional

### Requirements

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
3. **App-specific password** for notarization

### Generate Certificate

1. Go to developer.apple.com
2. Certificates, Identifiers & Profiles → Certificates
3. Create "Developer ID Application" certificate
4. Download and install in Keychain Access

### Configure Notarization

**File: `.env.local` (DO NOT COMMIT)**

```bash
# Apple ID credentials for notarization
APPLE_ID=your.email@example.com
APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
APPLE_TEAM_ID=XXXXXXXXXX  # Your team ID
```

**File: `electron/notarize.js`**

```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Skipping notarization: APPLE_ID or APPLE_ID_PASSWORD not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.yourcompany.chess-pgn-viewer',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

**Update electron-builder.json:**

```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "resources/entitlements.mac.plist",
    "entitlementsInherit": "resources/entitlements.mac.plist"
  },
  "afterSign": "electron/notarize.js"
}
```

**Checklist:**
- [ ] Enroll in Apple Developer Program
- [ ] Create Developer ID Application certificate
- [ ] Generate app-specific password
- [ ] Create .env.local with credentials (add to .gitignore!)
- [ ] Create electron/notarize.js
- [ ] Update electron-builder.json with afterSign hook
- [ ] Add .env.local to .gitignore

---

### 8. Code Signing (Windows) - Optional

### Requirements

1. **Code Signing Certificate** (from CA like DigiCert, Sectigo)
2. **signtool.exe** (included with Windows SDK)

### Configure Signing

**Option 1: Using PFX file**

Store certificate password in environment variable:

```bash
# .env.local (DO NOT COMMIT)
WIN_CSC_LINK=path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your_certificate_password
```

**Option 2: Using Windows Certificate Store**

If certificate is installed in Windows Certificate Store:

```json
// electron-builder.json
{
  "win": {
    "certificateSubjectName": "Your Company Name",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

**Checklist:**
- [ ] Purchase code signing certificate
- [ ] Install certificate (PFX or Certificate Store)
- [ ] Configure electron-builder for signing
- [ ] Set environment variables for certificate password
- [ ] Add certificate files to .gitignore

---

### 9. Build for Production

### macOS Build

```bash
# Build for current architecture
npm run electron:build:mac

# Build universal binary (Intel + Apple Silicon)
npm run electron:build -- --mac --universal

# Build and sign + notarize
APPLE_ID=your@email.com \
APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx \
APPLE_TEAM_ID=XXXXXXXXXX \
npm run electron:build:mac
```

**Output:**
- `dist-electron/Chess PGN Viewer-1.0.0.dmg` (installer)
- `dist-electron/Chess PGN Viewer-1.0.0-mac.zip` (portable)

### Windows Build

```bash
# Build for x64 architecture
npm run electron:build:win

# Build for both x64 and ia32
npm run electron:build -- --win --x64 --ia32

# Build with code signing
WIN_CSC_LINK=path/to/cert.pfx \
WIN_CSC_KEY_PASSWORD=password \
npm run electron:build:win
```

**Output:**
- `dist-electron/Chess PGN Viewer Setup 1.0.0.exe` (NSIS installer)
- `dist-electron/Chess PGN Viewer 1.0.0.exe` (portable)

### Build for All Platforms

```bash
npm run electron:build:all
```

**Note:** Cross-compilation limitations:
- macOS can build for all platforms
- Windows can build for Windows and Linux
- Linux can build for Linux and Windows

**Checklist:**
- [ ] Test build on macOS
- [ ] Test build on Windows
- [ ] Verify installer works correctly
- [ ] Verify app launches and functions
- [ ] Check bundle size is reasonable

---

### 10. Test Installation

### macOS Testing

1. **Install from DMG:**
   ```bash
   open dist-electron/Chess\ PGN\ Viewer-1.0.0.dmg
   ```
   - Drag app to Applications
   - Launch from Applications folder
   - Verify Gatekeeper allows it (if signed/notarized)

2. **Test ZIP distribution:**
   ```bash
   unzip dist-electron/Chess\ PGN\ Viewer-1.0.0-mac.zip
   open Chess\ PGN\ Viewer.app
   ```

3. **Verify Code Signing:**
   ```bash
   codesign --verify --deep --strict --verbose=2 \
     /Applications/Chess\ PGN\ Viewer.app
   
   spctl --assess --verbose=4 --type execute \
     /Applications/Chess\ PGN\ Viewer.app
   ```

### Windows Testing

1. **Install from NSIS installer:**
   - Run `Chess PGN Viewer Setup 1.0.0.exe`
   - Follow installation wizard
   - Launch from Start Menu

2. **Test portable version:**
   - Run `Chess PGN Viewer 1.0.0.exe` directly
   - No installation required

3. **Verify Code Signing:**
   - Right-click EXE → Properties → Digital Signatures
   - Verify certificate is valid

**Checklist:**
- [ ] Test DMG installation (macOS)
- [ ] Test ZIP portable (macOS)
- [ ] Test NSIS installer (Windows)
- [ ] Test portable EXE (Windows)
- [ ] Verify code signatures
- [ ] Test on fresh machines (no dev tools)
- [ ] Verify all features work in production build

---

### 11. Verify Bundle Sizes

Expected sizes:

```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Analyze Vite build
npx vite-bundle-visualizer
```

### Optimization Techniques

1. **Exclude dev dependencies from production:**
   - Verify package.json has correct dependencies/devDependencies split

2. **Use electron-builder's file patterns:**
   ```json
   {
     "files": [
       "dist/**/*",
       "electron/**/*",
       "!electron/**/*.test.js",
       "!**/*.map"
     ]
   }
   ```

3. **Compress Electron binaries:**
   ```json
   {
     "compression": "maximum"
   }
   ```

4. **Tree-shake unused code:**
   - Vite handles this automatically
   - Ensure imports are ES6 modules

5. **Optimize sample games:**
   - Only include essential games (60, not 1000+)
   - Strip unnecessary PGN comments

**Target sizes:**
- macOS DMG: ~80-120 MB
- Windows installer: ~60-90 MB
- Portable versions: ~70-100 MB

**Checklist:**
- [ ] Analyze bundle composition
- [ ] Remove unnecessary files from build
- [ ] Enable maximum compression
- [ ] Verify bundle sizes are reasonable

---

### 12. (Optional) Setup Auto-Updates

**File: `electron-builder.json`**

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "your-github-username",
      "repo": "chess-pgn-viewer",
      "releaseType": "release"
    }
  ]
}
```

**File: `electron/main.js` (add auto-updater):**

```javascript
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Check for updates on startup
app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after 3 seconds
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

// Auto-update events
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  // Show notification to user
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart to apply the update?',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  log.error('Update error:', err);
});
```

**Install electron-updater:**

```bash
npm install electron-updater electron-log
```

**Checklist:**
- [ ] Install electron-updater and electron-log
- [ ] Configure publish settings in electron-builder.json
- [ ] Add auto-update logic to main.js
- [ ] Test update flow (requires published release)

---

### 13. (Optional) Create Release Workflow

**File: `.github/workflows/release.yml`**

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application (macOS)
        if: matrix.os == 'macos-latest'
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run electron:build:mac
      
      - name: Build application (Windows)
        if: matrix.os == 'windows-latest'
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run electron:build:win
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: dist-electron/*
      
      - name: Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: dist-electron/*
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Setup GitHub Secrets:**

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_ID_PASSWORD`: App-specific password
   - `APPLE_TEAM_ID`: Your Apple team ID
   - `WIN_CSC_LINK`: Base64-encoded Windows certificate
   - `WIN_CSC_KEY_PASSWORD`: Certificate password

**Checklist:**
- [ ] Create .github/workflows/release.yml
- [ ] Add GitHub secrets for code signing
- [ ] Test workflow with a test tag
- [ ] Verify releases are created automatically

---

## 8.14 Versioning and Release Process

### Semantic Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

1. **Update version:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Update CHANGELOG.md:**
   ```markdown
   ## [1.0.1] - 2025-01-15
   
   ### Added
   - New feature X
   
   ### Fixed
   - Bug Y
   
   ### Changed
   - Improved Z
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   ```

4. **Create tag:**
   ```bash
   git tag v1.0.1
   ```

5. **Push with tags:**
   ```bash
   git push origin main --tags
   ```

6. **GitHub Actions will automatically:**
   - Build for macOS and Windows
   - Sign and notarize builds
   - Create GitHub release
   - Upload installers

**Checklist:**
- [ ] Create CHANGELOG.md
- [ ] Document release process
- [ ] Test release workflow
- [ ] Set up semantic versioning

---

## 8.15 Distribution Platforms

### Direct Distribution

**GitHub Releases:**
- ✅ Free hosting
- ✅ Auto-updates via electron-updater
- ✅ Version control integration
- Best for open-source projects

### App Stores

**macOS App Store:**
- Requires different provisioning profile
- Different entitlements (sandboxed)
- Review process (1-3 days)
- $99/year Apple Developer account

**Microsoft Store:**
- Requires app package (.appx)
- Different build configuration
- Review process
- $19 one-time fee

**Homebrew (macOS):**
```bash
# Create Homebrew cask
brew create --cask https://github.com/user/repo/releases/download/v1.0.0/app.dmg
```

**Chocolatey (Windows):**
```bash
# Create Chocolatey package
choco new chess-pgn-viewer
```

**Checklist:**
- [ ] Choose distribution platforms
- [ ] Set up GitHub Releases
- [ ] (Optional) Submit to app stores
- [ ] (Optional) Create Homebrew cask
- [ ] (Optional) Create Chocolatey package

---

## 8.16 Create User Documentation

### Create README.md

**File: `README.md`**

```markdown
# Chess PGN Viewer

A lightweight desktop application for browsing and analyzing chess game databases.

## Features

- 📁 Multi-collection management
- 🔍 Advanced search and filtering
- ♟️ Interactive game replay
- 📊 Integration with Lichess analysis
- 🎯 Bundled with 60 memorable Bobby Fischer games

## Installation

### macOS

1. Download `Chess-PGN-Viewer-1.0.0.dmg` from [Releases](https://github.com/user/repo/releases)
2. Open the DMG file
3. Drag the app to Applications
4. Launch from Applications folder

### Windows

1. Download `Chess-PGN-Viewer-Setup-1.0.0.exe` from [Releases](https://github.com/user/repo/releases)
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu

## Getting Started

### First Launch

1. The app includes 60 Bobby Fischer games to get started
2. Click "Create Collection from Sample Games" on first launch
3. Browse games in the sidebar
4. Click a game to view it on the board

### Importing Your Games

1. Click "Import PGN" button
2. Select your .pgn file
3. Choose or create a collection
4. Wait for indexing to complete

### Searching Games

Use the search bar to filter by:
- Player names (white/black)
- Event name
- Date range
- Result (1-0, 0-1, 1/2-1/2)
- ELO rating
- ECO code

### Analyzing on Lichess

1. View any game
2. Click "Analyze on Lichess" button
3. Game opens in Lichess analysis board

## Building from Source

```bash
# Clone repository
git clone https://github.com/user/chess-pgn-viewer
cd chess-pgn-viewer

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build
```

## Tech Stack

- Electron 27+
- React 18+
- SQLite (better-sqlite3)
- chess.js
- Tailwind CSS

## License

MIT License - see LICENSE file

## Credits

- Chess board UI: Inspired by Lichess Chessground
- Sample games: Bobby Fischer's 60 Memorable Games
```

**Checklist:**
- [ ] Create comprehensive README.md
- [ ] Include screenshots
- [ ] Document all features
- [ ] Add installation instructions
- [ ] Add build instructions

---

## 8.17 Create User Guide

**File: `docs/USER_GUIDE.md`**

Create detailed user guide covering:
- First-time setup
- Importing PGN files
- Managing collections
- Searching and filtering
- Game replay controls
- Lichess integration
- Keyboard shortcuts
- Troubleshooting

**Checklist:**
- [ ] Create docs/USER_GUIDE.md
- [ ] Add screenshots and GIFs
- [ ] Document all features
- [ ] Include troubleshooting section

---

## 8.18 Create Developer Documentation

**File: `docs/DEVELOPMENT.md`**

Document:
- Project structure
- Architecture overview
- Build process
- Testing strategy
- Contributing guidelines
- Code style
- Release process

**Checklist:**
- [ ] Create docs/DEVELOPMENT.md
- [ ] Document architecture
- [ ] Explain build process
- [ ] Add contributing guidelines

---

## 8.19 Pre-Release Checklist

Before releasing v1.0.0:

### Code Quality
- [ ] All tests passing
- [ ] Test coverage > 60%
- [ ] No console errors in production build
- [ ] Linting passes
- [ ] No TODO comments in production code

### Functionality
- [ ] Import PGN works correctly
- [ ] All search filters work
- [ ] Game replay works smoothly
- [ ] Lichess integration works
- [ ] Collections management works
- [ ] Sample games load correctly

### Build & Distribution
- [ ] macOS DMG builds successfully
- [ ] macOS app is signed and notarized
- [ ] Windows installer builds successfully
- [ ] Windows app is signed
- [ ] App icons display correctly
- [ ] DMG background looks professional
- [ ] Installer wizard works correctly

### Documentation
- [ ] README is complete
- [ ] LICENSE file exists
- [ ] User guide is comprehensive
- [ ] Developer docs are clear
- [ ] CHANGELOG is up to date

### Testing
- [ ] Tested on macOS (Intel)
- [ ] Tested on macOS (Apple Silicon)
- [ ] Tested on Windows 10
- [ ] Tested on Windows 11
- [ ] Fresh install works on clean machines
- [ ] Auto-update works (if implemented)

### Legal & Compliance
- [ ] License is appropriate
- [ ] All dependencies' licenses are compatible
- [ ] Copyright notices are correct
- [ ] Privacy policy (if collecting data)
- [ ] Terms of service (if applicable)

---

## 8.20 Post-Release Tasks

After releasing v1.0.0:

1. **Announce Release:**
   - Post on social media
   - Submit to product directories (Product Hunt, etc.)
   - Post on relevant forums (chess communities)
   - Write blog post

2. **Monitor Issues:**
   - Watch GitHub issues
   - Respond to bug reports
   - Collect feature requests

3. **Plan Next Release:**
   - Prioritize bug fixes
   - Evaluate feature requests
   - Update roadmap

**Checklist:**
- [ ] Announce release
- [ ] Monitor for issues
- [ ] Respond to user feedback
- [ ] Plan next iteration

---

### 14. Create Release on GitHub

```bash
# Update version
npm version patch  # or minor/major

# Create release tag
git tag v1.0.0
git push origin main --tags

# GitHub Actions will automatically build and release
```

### 15. Announce Release

- Post on social media
- Post in chess forums
- Write release notes
- Link to download page

---

## Quick Commands Reference

```bash
npm run electron:build:mac       # Build macOS DMG
npm run electron:build:win       # Build Windows EXE
npm run electron:build:all       # Build both
npm run test:coverage            # Verify coverage > 60%
```

---

## Summary

**Completed:**
- Icons and assets created
- LICENSE file added
- Installers built (macOS .dmg, Windows .exe)
- (Optional) Code signed
- (Optional) Auto-updates configured
- GitHub release workflow (optional)
- Documentation complete

**MVP is complete and ready to ship!**
