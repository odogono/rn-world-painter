import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '@helpers/log';
import type { LayoutInsets, Vector2 } from '@types';
import {
  useFlowerMenuEvents,
  useFlowerMenuNode,
  useFlowerMenuStore,
  useMenuStore
} from './store/context';
import { NodeState } from './types';

const log = createLogger('FlowerNodeComponent');

export type FlowerNodeComponentProps = {
  nodeId: string;
};

const WIDTH = 56;
const HEIGHT = 56;

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
  const node = useFlowerMenuNode(nodeId);

  // const nodeState = useMenuStore().use.getNodeState()(nodeId);
  const nodeIcon = useMenuStore().use.getNodeIcon()(nodeId);
  const handleNodeTap = useMenuStore().use.handleNodeSelect();
  const handleNodeDragStart = useMenuStore().use.handleNodeDragStart();
  const handleNodeDragEnd = useMenuStore().use.handleNodeDragEnd();
  const isGroup = node.children?.length > 0;
  const isChild = node.parentId !== undefined;

  const gesture = useGestures({
    handleNodeTap,
    handleNodeDragStart,
    handleNodeDragEnd,
    node
  });

  // useEffect(() => {
  //   log.debug('ns changed', nodeId, ns);
  // }, [ns]);
  // useEffect(() => {
  //   log.debug('nodeState changed', nodeId, nodeState);
  // }, [nodeState]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // transform: [{ scale: getNodeState(node.id)?.isOpen ? 1 : 0.5 }]
      transform: [
        { scale: 1 },
        { translateX: node.position.value.x },
        { translateY: node.position.value.y }
      ]
    };
  });

  // if (!nodeState) return null;

  // log.debug('FlowerNodeComponent', nodeId);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.modeButton,
          animatedStyle,
          isGroup ? styles.groupButton : {},
          node.isActive ? styles.isActive : {},
          isChild ? styles.isChild : {}
        ]}
      >
        <MaterialIcons
          name={nodeIcon as keyof typeof MaterialIcons.glyphMap}
          size={24}
          color='black'
        />
      </Animated.View>
    </GestureDetector>
  );
};

type UseGesturesProps = {
  node: NodeState;
  handleNodeTap: (nodeId: string) => void;
  handleNodeDragStart: (nodeId: string) => void;
  handleNodeDragEnd: (nodeId: string) => void;
};

const useGestures = ({
  node,
  handleNodeTap,
  handleNodeDragStart,
  handleNodeDragEnd
}: UseGesturesProps) => {
  // const events = useFlowerMenuEvents();
  const translation = useSharedValue<Vector2>({ x: 0, y: 0 });
  const { id: nodeId, position } = node;

  const gesture = useMemo(() => {
    const singleTap = Gesture.Tap()
      .maxDuration(250)
      .onStart(() => {
        runOnJS(handleNodeTap)(nodeId);
        // runOnJS(log.debug)('single tap');
      });

    // const doubleTap = Gesture.Tap()
    //   .numberOfTaps(2)
    //   .onEnd((event, success) => {
    //     'worklet';
    //     runOnJS(log.debug)(`double tap ${success}?`);
    //   });

    // const longPress = Gesture.LongPress()
    //   .minDuration(500)
    //   .onStart(() => {
    //     'worklet';
    //     runOnJS(log.debug)('long press start');
    //   })
    //   .onEnd((event, success) =>
    //     runOnJS(log.debug)(`long press ${success}? ${event.duration}`)
    //   );

    const drag = Gesture.Pan()
      .onStart(() => {
        'worklet';
        translation.value = { x: position.value.x, y: position.value.y };
        runOnJS(handleNodeDragStart)(nodeId);
      })
      .onUpdate(({ translationX, translationY }) => {
        position.modify((p) => {
          p.x = translation.value.x + translationX;
          p.y = translation.value.y + translationY;
          return p;
        });
      })
      .onEnd(() => {
        runOnJS(handleNodeDragEnd)(nodeId);
      })
      .minDistance(2);

    return Gesture.Exclusive(singleTap, drag);
  }, [nodeId]);

  return gesture;
};

const styles = StyleSheet.create({
  modeButton: {
    position: 'absolute',
    // bottom: 32,
    // right: 32,
    width: WIDTH,
    height: HEIGHT,
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
  },
  groupButton: {
    borderWidth: 1,
    borderColor: 'black',
    borderStyle: 'dashed',
    zIndex: 2
  },
  isActive: {
    backgroundColor: '#999'
  },
  isChild: {
    zIndex: 1
  }
});
