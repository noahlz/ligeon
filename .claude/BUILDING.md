# Building Ligeon

Build and packaging documentation for macOS and Windows releases.

## macOS

### Code Signing and Notarization

Apple requires hardened runtime + notarization for all Developer ID apps distributed outside the Mac App Store. Without hardened runtime explicitly enabled and proper entitlements, Apple's notarization pipeline hangs submissions indefinitely ("In Progress" with no diagnostic output).

**Configuration files:**
- `electron-builder.json` — `mac` section: `hardenedRuntime`, `gatekeeperAssess`, `entitlements`, `entitlementsInherit`
- `build/entitlements.mac.plist` — main process entitlements (JIT, unsigned executable memory, library validation)
- `build/entitlements.mac.inherit.plist` — identical; applied to helper processes and frameworks

**CI workflow** (`.github/workflows/_build-artifacts.yml`):
- `apple-actions/import-codesign-certs@v3` — sets up the signing keychain; required to prevent `codesign` from hanging waiting for an interactive password prompt on CI runners ([blog post](https://www.codejam.info/2025/06/github-action-hanging-macos-app-code-signing.html))
- `Write App Store Connect API key` — writes the `.p8` notarization key to disk; no equivalent GitHub Action exists for this step

**Local signing:**

```bash
# One-time: pre-authorize codesign to access your Developer ID key without interactive prompts
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "<mac-login-password>" ~/Library/Keychains/login.keychain-db

# Check notarization queue
xcrun notarytool history --apple-id <email> --team-id <team-id>
```

### References

- [Hardened Runtime — Apple Developer Docs](https://developer.apple.com/documentation/security/hardened-runtime)
- [Notarizing macOS Software — Apple Developer Docs](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- [electron-builder macOS Configuration](https://www.electron.build/mac)
- [Notarizing Your Electron Application — Kilian Valkhof](https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/) *(good gotchas)*

---

## Windows

TBD
