import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aura.expensetracker',
  appName: 'FinCore AI',
  webDir: 'out',
  // Server URL mode: load the live running web app instead of static files.
  // This means no static export is needed — the web version stays untouched.
  server: {
    // 10.0.2.2    = Android emulator special alias for host localhost
    // 10.10.33.26 = host machine LAN IP (for real physical devices on the same WiFi)
    url: 'http://10.0.2.2:3009',
    cleartext: true,
    androidScheme: 'http',
    allowNavigation: ['10.10.33.26', '10.0.2.2', 'localhost', '127.0.0.1'],
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
