import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

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
