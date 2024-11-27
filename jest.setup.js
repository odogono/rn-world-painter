require('react-native-reanimated').setUpTests();

jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    Color: () => new Float32Array([1, 1, 1, 1])
  }
}));
