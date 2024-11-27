const jestConfig = {
  preset: 'jest-expo',
  fakeTimers: {
    enableGlobally: true
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/react-native-skia/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};

export default jestConfig;
