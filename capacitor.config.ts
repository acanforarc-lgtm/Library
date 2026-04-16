import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acanfora.yourlibrary',
  appName: 'Library',
  webDir: 'www',
  ios: {
    contentInset: 'never',
    backgroundColor: '#faf8f3',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
