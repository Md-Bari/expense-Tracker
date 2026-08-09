import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aura.expensetracker',
  appName: 'Aura',
  webDir: 'public',
  // Server URL mode: load the live running web app instead of static files.
  // This means no static export is needed — the web version stays untouched.
  server: {
    url: 'https://joshua-intervention-offices-acquired.trycloudflare.com',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Allows DevTools debugging via Chrome
  },
  plugins: {
    // Allow the app to stay full-screen
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
