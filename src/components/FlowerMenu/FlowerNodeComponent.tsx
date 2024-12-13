import { Dimensions, StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle } from 'react-native-reanimated';

import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '@helpers/log';
import { useFlowerMenuStore, useMenuStore } from './storeContext';

const { width, height } = Dimensions.get('window');

const log = createLogger('FlowerNodeComponent');

export type FlowerNodeComponentProps = {
  nodeId: string;
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
export const FlowerNodeComponent = ({ nodeId }: FlowerNodeComponentProps) => {
  const handleNodeTap = useFlowerMenuStore((s) => s.handleNodeTap);
  // const getNodeState = useFlowerMenuStore((s) => s.getNodeState);
  const nodeState = useMenuStore().use.getNodeState()(nodeId);

  // const { icon } = node;

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      runOnJS(handleNodeTap)(nodeState?.id ?? '');
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // transform: [{ scale: getNodeState(node.id)?.isOpen ? 1 : 0.5 }]
      transform: [{ scale: 1 }]
    };
  });

  if (!nodeState) return null;

  log.debug('FlowerNodeComponent', nodeState);
  const { icon } = nodeState;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.modeButton, animatedStyle]}>
        <MaterialIcons
          name={icon as keyof typeof MaterialIcons.glyphMap}
          size={24}
          color='black'
        />
      </Animated.View>
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
