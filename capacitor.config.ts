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
  },
};

export default config;
