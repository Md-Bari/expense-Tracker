import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aura.expensetracker',
  appName: 'Aura',
  webDir: 'public',
  // Server URL mode: load the live running web app instead of static files.
  // This means no static export is needed — the web version stays untouched.
  server: {
    // Use your PC's local network IP so a real Android phone can connect.
    // For Android Studio Emulator, use 10.0.2.2 instead of 192.168.x.x
    url: 'http://10.10.33.26:3009',
    cleartext: true, // Allow HTTP (not just HTTPS) for local development
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
