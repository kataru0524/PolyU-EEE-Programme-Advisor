import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'hk.edu.polyu.eee.advisor',
  appName: 'EEE Advisor',

  // --- Mode A: Server URL (default) ---
  // The native app loads from the deployed Next.js server.
  // No static export needed; all API routes work normally.
  // Switch to the URL where your Next.js app is running.
  server: {
    url: 'https://polyu-eee-advisor.vercel.app',
  },

  // --- Mode B: Bundled static export (uncomment to use) ---
  // Requires `output: 'export'` in web/next.config.js and running `next build` first.
  // Then run `npx cap sync` from this folder to copy web/out/ into native projects.
  // webDir: '../web/out',

  android: {
    // Android 6.0 (API 23) is the minimum supported by Capacitor 6
    minWebViewVersion: 60, // prompt to update WebView if below Chrome 60
  },

  ios: {
    contentInset: 'always',
  },
}

export default config
