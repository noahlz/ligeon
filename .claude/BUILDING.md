# Building Ligeon

Build and packaging documentation for macOS and Windows releases.

## macOS

### Hardened Runtime and Notarization

**Problem:** macOS requires hardened runtime + notarization for all Developer ID apps distributed outside the Mac App Store. Without hardened runtime explicitly enabled and proper entitlements configured, Apple's notarization pipeline rejects or hangs submissions indefinitely. This manifested as submissions stuck "In Progress" for 20+ hours with no diagnostic output.

**Solution:** Enable hardened runtime in electron-builder configuration and provide entitlements files that allow JIT compilation (required for V8/Electron) and disable library validation (required for native modules like `better-sqlite3`).

### Configuration

#### electron-builder.json

Add to the `mac` section:

```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.inherit.plist"
  }
}
```

**Configuration keys:**
- `hardenedRuntime: true` — enables hardened runtime (required for notarization)
- `gatekeeperAssess: false` — disables extra gatekeeper checks during signing
- `entitlements` — path to main app entitlements file
- `entitlementsInherit` — path to child/framework entitlements (usually same as main)

#### Entitlements Files

Both `build/entitlements.mac.plist` and `build/entitlements.mac.inherit.plist` should contain:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- JIT compilation - required for V8 JavaScript engine -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>

    <!-- Allow unsigned executable memory - required for Electron <12 -->
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>

    <!-- Disable library validation - allows loading external frameworks/plugins -->
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
  </dict>
</plist>
```

**Key entitlements:**
- `com.apple.security.cs.allow-jit` — required; enables JIT compilation for V8
- `com.apple.security.cs.allow-unsigned-executable-memory` — required for Electron <12; can be omitted if targeting Electron 12+ only
- `com.apple.security.cs.disable-library-validation` — allows loading of unsigned external libraries/native modules

Both files can be identical for most Electron apps.

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| App crashes on launch | Missing entitlements with hardened runtime enabled | Ensure `allow-jit` and `allow-unsigned-executable-memory` are present |
| Notarization hangs indefinitely ("In Progress") | Hardened runtime not enabled | Add `hardenedRuntime: true` and proper entitlements files |
| Notarization fails with "Invalid Signature" | Code signature doesn't match entitlements, or XML syntax errors | Validate plist XML; use same entitlements for both files |
| Native modules fail to load | Library validation enabled (default) and libraries are unsigned | Include `disable-library-validation: true` in entitlements |

### Debugging

```bash
# Check if app is signed with hardened runtime
spctl --assess --type open --context context:primary-signature -v /path/to/app.app

# Inspect code signature details
codesign -dv /path/to/app.app

# View entitlements in signed app
codesign -d --entitlements :- /path/to/app.app

# Check notarization status
xcrun notarytool history --apple-id <email> --team-id <team-id>
```

### References

**Apple Official Documentation:**
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened-runtime)
- [Configuring the Hardened Runtime](https://developer.apple.com/documentation/xcode/configuring-the-hardened-runtime)
- [Entitlements](https://developer.apple.com/documentation/bundleresources/entitlements)
- [Notarizing macOS Software Before Distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)

**electron-builder Documentation:**
- [macOS Configuration](https://www.electron.build/mac)
- [MacConfiguration Interface](https://www.electron.build/electron-builder.Interface.MacConfiguration.html)
- [Default Entitlements Template](https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/templates/entitlements.mac.plist)

**Community Guides:**
- [Notarizing Your Electron Application - Kilian Valkhof](https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/)
- [Notarizing Your Electron App - Samuel Meuli](https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app/)
- [Signing and Notarizing Electron App with GitHub Actions - Simon Willison's TILs](https://til.simonwillison.net/electron/sign-notarize-electron-macos)
- [Signing a macOS App - Electron Forge](https://www.electronforge.io/guides/code-signing/code-signing-macos)

---

## Windows

TBD
