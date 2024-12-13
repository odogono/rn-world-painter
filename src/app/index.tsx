import { StyleSheet, View } from 'react-native';

import { FiberProvider } from 'its-fine';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Painter } from '@components/ConcaveHull/Painter';
import { EventsProvider } from '@contexts/Events';
import { RemoteLogProvider } from '@contexts/RemoteLogContext';
import { StoreProvider } from '@model/StoreProvider/StoreProvider';

const logServerUrl = process.env.EXPO_PUBLIC_LOG_SERVER_URL ?? '';

export default () => {
  return (
    <FiberProvider>
      <EventsProvider>
        <RemoteLogProvider url={logServerUrl}>
          <GestureHandlerRootView style={styles.gestureContainer}>
            <View style={styles.container}>
              <StoreProvider>
                <Painter />
              </StoreProvider>
            </View>
          </GestureHandlerRootView>
        </RemoteLogProvider>
      </EventsProvider>
    </FiberProvider>
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
