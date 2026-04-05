// Fetches the latest release from the GitHub API at build time.
// Returns structured data for version string and per-platform download URLs.
// On any error (no releases, API failure, network issue), returns nulls so
// the template can render a graceful fallback.
export default async function () {
  try {
    const response = await fetch(
      "https://api.github.com/repos/noahlz/ligeon/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      console.warn(`[release.js] GitHub API returned ${response.status}`);
      return { version: null, mac: null, win: null, linux: null };
    }

    const data = await response.json();

    // Strip leading "v" from tag name (e.g. "v0.2.1" → "0.2.1")
    const version = data.tag_name ? data.tag_name.replace(/^v/, "") : null;

    const assets = data.assets ?? [];

    const findAsset = (ext) => {
      const asset = assets.find((a) => a.name.endsWith(ext));
      if (!asset) return null;
      return { url: asset.browser_download_url, filename: asset.name };
    };

    return {
      version,
      mac: findAsset(".dmg"),
      win: findAsset(".exe"),
      linux: findAsset(".AppImage"),
    };
  } catch (err) {
    console.warn("[release.js] Failed to fetch release data:", err.message);
    return { version: null, mac: null, win: null, linux: null };
  }
}
