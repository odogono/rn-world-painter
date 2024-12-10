import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Painter } from '@components/ConcaveHull/Painter';
import { RemoteLogProvider } from '@contexts/RemoteLogContext';

export default () => {
  return (
    <RemoteLogProvider url='wss://kid-large-rightly.ngrok-free.app/socket?room=rn-world-painter'>
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
