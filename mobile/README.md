# Mobile App Wrapper

This folder packages the web advisor into native Android and iOS apps using Capacitor 6. The primary motivation is deployment on a **Temi Robot** for campus events — a native wrapper allows the chatbot to run full-screen, providing a better kiosk-style experience than a browser tab.

## Runtime Mode

`capacitor.config.ts` sets:

```ts
appId: 'hk.edu.polyu.eee.advisor'
appName: 'EEE Advisor'

server: {
  url: 'https://polyu-eee-advisor.vercel.app',
}
```

This is **Mode A (server URL mode)**: the native app loads the live deployed Next.js site in a native WebView. All API routes, Dify proxy calls, session cookies, and i18n behavior are handled by the server, not the device. This avoids the need to ship API keys in the native bundle.

An alternative **Mode B (bundled static export)** is documented but commented out. It requires `output: 'export'` in `web/next.config.js` and pointing `webDir` to `../web/out`. This is appropriate for offline or air-gapped demo scenarios.

## Folder Contents

| Item | Description |
|---|---|
| `android/` | Android project generated and managed by Capacitor |
| `ios/` | iOS project generated and managed by Capacitor |
| `capacitor.config.ts` | App ID, name, server URL, and platform settings |
| `build-mobile.sh` | Coordination script for building and syncing |
| `gen_icons.py` | Generates icon and splash screen assets from `web/public/eee-logo.png` |
| `package.json` | Capacitor 6 deps and npm scripts |

## `build-mobile.sh`

```
Usage:
  ./build-mobile.sh         # sync both Android and iOS
  ./build-mobile.sh android # sync Android only
  ./build-mobile.sh ios     # sync iOS only
```

The script navigates to `../web`, runs `npm run build`, then returns and runs `npx cap sync [platform]`. In server URL mode, the `cap sync` step only syncs native plugin code, not web assets (since the WebView loads from the remote URL).

## `gen_icons.py`

Generates all icon and splash assets from `web/public/eee-logo.png` via Pillow:

- **iOS icons:** 1024×1024 white-background PNG (`AppIcon-512@2x.png`).
- **Android legacy icons** (pre-API 26): circle crop with white background, all `mipmap-*` densities (48, 72, 96, 144, 192 px) for both `ic_launcher` and `ic_launcher_round`.
- **Android adaptive foreground** (API 26+): transparent background with 17% padding for the logo to stay within the 66% adaptive icon safe zone.
- **iOS splash screens:** 2732×2732 PNG repeated for all 3 scale slots.
- **Android splash screens:** 11 density/orientation variants (portrait + landscape from mdpi to xxxhdpi), logo at 35% of the shorter screen dimension.

## npm Scripts

```bash
npm run sync              # cap sync (both platforms)
npm run sync:android      # cap sync android
npm run sync:ios          # cap sync ios
npm run open:android      # cap open android (Android Studio)
npm run open:ios          # cap open ios (Xcode)
npm run deploy:android    # build:web + cap sync android
npm run deploy:ios        # build:web + cap sync ios
```

## Platform Specifics

- **Android:** Minimum WebView version: Chrome 60 (API 23 minimum, Capacitor 6 baseline).
- **iOS:** `contentInset: 'always'` — prevents content from overlapping the notch/status bar.

## Temi Robot Deployment

The Android build is intended for deployment on a **Temi Robot** for campus events such as PolyU Info Day.

- Temi runs **Android 6.0.1 (API 23)**, which matches the Capacitor 6 minimum but ships with an outdated WebView.
- **WebView must be updated** on the Temi device before the app (or even the browser) can run correctly. Install the latest Android System WebView APK manually via ADB or the device's app store if available.
- Once WebView is updated, both the installed Capacitor app and direct browser access to `https://polyu-eee-advisor.vercel.app` should work on Temi.

## Why This Layer Exists

The original motivation was the **Temi Robot** deployment at PolyU Info Day. Running the chatbot as a native app allows it to occupy the full screen on Temi, which a browser cannot do. The same wrapper also enables standard iOS and Android distribution without duplicating any UI logic — the web app remains the single source of all behaviour.