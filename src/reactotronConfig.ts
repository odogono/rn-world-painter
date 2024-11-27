import Reactotron from 'reactotron-react-native';

Reactotron.configure({
  name: 'ODGN Expo Starter'
})
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate|127.0.0.1/
    },
    editor: false,
    errors: { veto: (stackFrame) => false },
    overlay: false
  })
  .connect();
