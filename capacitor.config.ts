import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.812b6767f379483ab5494ebfde313899',
  appName: 'FanHub',
  webDir: 'dist',
  server: {
    url: 'https://812b6767-f379-483a-b549-4ebfde313899.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  android: {
    backgroundColor: '#0F172A'
  },
  ios: {
    backgroundColor: '#0F172A'
  }
};

export default config;
