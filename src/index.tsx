import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import {
  ReanimatedLogLevel,
  configureReanimatedLogger
} from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false // Reanimated runs in strict mode by default
});

if (__DEV__) {
  require('./reactotronConfig');
}

// Must be exported or Fast Refresh won't update the context
const App = () => {
  const ctx = require.context('./app'); //Path with src folder
  return <ExpoRoot context={ctx} />;
};

registerRootComponent(App);

export default App;
