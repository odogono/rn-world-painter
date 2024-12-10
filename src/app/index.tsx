import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Painter } from '@components/Painter';
import {
  RemoteLogProvider,
  useRemoteLogContext
} from '@contexts/RemoteLogContext';
import { createLogger } from '../helpers/log';

const log = createLogger('App');

export default () => {
  // const { isConnected, ...rlog } = useRemoteLogContext();

  // useEffect(() => {
  //   log.debug('isConnected', rlog);
  //   if (isConnected) {
  //     rlog.sendMessage('Hello from RN app');
  //     rlog.sendJSON({
  //       type: 'hello',
  //       message: 'Hello from RN app',
  //       values: [1, 2, 3]
  //     });
  //   }
  // }, [isConnected]);

  return (
    <RemoteLogProvider url='wss://kid-large-rightly.ngrok-free.app/socket'>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <View style={styles.container}>
          <Painter />
        </View>
      </GestureHandlerRootView>
    </RemoteLogProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gestureContainer: {
    flex: 1
  }
});
