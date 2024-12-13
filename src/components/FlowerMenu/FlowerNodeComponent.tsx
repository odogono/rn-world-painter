import { Dimensions, StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '@helpers/log';
import { FlowerNode } from './store';

const { width, height } = Dimensions.get('window');

const log = createLogger('FlowerNode');

export type FlowerNodeComponentProps = {
  node: FlowerNode;
};

/**
 * Single tap - cycle through children
 * Long tap - open children
 * Very long press - move mode (move to anywhere on screen)
 *
 *
 * @param param0
 * @returns
 */
export const FlowerNodeComponent = ({ node }: FlowerNodeComponentProps) => {
  const { icon } = node;

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      'worklet';
      runOnJS(log.debug)('single tap');
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event, success) => {
      'worklet';
      runOnJS(log.debug)(`double tap ${success}?`);
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      'worklet';
      runOnJS(log.debug)('long press start');
    })
    .onEnd((event, success) =>
      runOnJS(log.debug)(`long press ${success}? ${event.duration}`)
    );

  const gesture = Gesture.Exclusive(doubleTap, singleTap, longPress);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.modeButton}>
        <MaterialIcons
          name={icon as keyof typeof MaterialIcons.glyphMap}
          size={24}
          color='black'
        />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  modeButton: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  }
});
