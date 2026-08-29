import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fincore.expensetracker',
  appName: 'FinCore AI',
  webDir: 'public',
  // Server URL mode: load the live running web app instead of static files.
  // This means no static export is needed — the web version stays untouched.
  server: {
    url: 'http://10.0.2.2:3009',
    cleartext: true,
    androidScheme: 'http',
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
