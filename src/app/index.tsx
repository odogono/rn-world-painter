import { StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Painter } from '@components/Painter';

export default () => (
  <GestureHandlerRootView style={styles.gestureContainer}>
    <View style={styles.container}>
      <Painter />
    </View>
  </GestureHandlerRootView>
);

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
