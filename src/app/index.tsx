import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Painter } from '@components/Painter';
import { usePhoenix } from '@hooks/usePhoenix';

export default () => {
  const { messages, sendMessage, sendJSON, isConnected } = usePhoenix();

  useEffect(() => {
    if (isConnected) {
      sendMessage('Hello from RN app');
      sendJSON({
        type: 'hello',
        message: 'Hello from RN app',
        values: [1, 2, 3]
      });
    }
  }, [isConnected]);

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <View style={styles.container}>
        <Painter />
      </View>
    </GestureHandlerRootView>
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
