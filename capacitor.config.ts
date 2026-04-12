import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.butterbarn.deluxe',
  appName: 'Butter Barn',
  webDir: 'out',
  android: {
    backgroundColor: '#F7F2EA',
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F7F2EA',
      overlaysWebView: false,
    },
    CapacitorUpdater: {
      autoUpdate: true,
      defaultChannel: 'production',
    },
  },
  // Uncomment for live reload during development:
  // server: {
  //   url: 'http://192.168.40.225:3000',
  //   cleartext: true,
  // },
};

export default config;
