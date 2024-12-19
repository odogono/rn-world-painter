import { useMemo } from 'react';

import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import type { Vector2 } from '@types';
import { NodeState } from './types';

export type UseGesturesProps = {
  node: NodeState;
  handleNodeTap: (nodeId: string) => void;
  handleNodeDragStart: (nodeId: string) => void;
  handleNodeDragEnd: (nodeId: string) => void;
};

export const useFlowerNodeGestures = ({
  node,
  handleNodeTap,
  handleNodeDragStart,
  handleNodeDragEnd
}: UseGesturesProps) => {
  const translation = useSharedValue<Vector2>({ x: 0, y: 0 });
  const { id: nodeId, position } = node;

  const gesture = useMemo(() => {
    const singleTap = Gesture.Tap()
      .maxDuration(250)
      .onStart(() => {
        runOnJS(handleNodeTap)(nodeId);
        // runOnJS(log.debug)('single tap');
      });

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
