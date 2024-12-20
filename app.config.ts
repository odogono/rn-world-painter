import * as dotenv from 'dotenv';

import { ConfigContext, ExpoConfig } from '@expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ODGN World Painter',
  slug: 'odgn-world-painter',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'net.odgn.rnworldpainter'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'net.odgn.rnworldpainter'
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      'expo-font',
      {
        assetBundlePatterns: ['**/*'],
        fonts: [
          './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf',
          './node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'
        ]
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
});
