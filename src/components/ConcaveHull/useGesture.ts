import { useMemo } from 'react';

import { SkPoint } from '@shopify/react-native-skia';
import { Gesture } from 'react-native-gesture-handler';

export type UseGestureProps = {
  onUpdate: (point: SkPoint) => void;
  onEnd?: () => void | undefined;
};

export const useGesture = ({ onUpdate, onEnd }: UseGestureProps) => {
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(({ x, y }) => {
          'worklet';
          onUpdate({ x, y });
          // runOnJS(log.info)('start', { x, y });
        })
        .onUpdate(({ x, y }) => {
          'worklet';
          // runOnJS(log.info)('update', { x, y });
          onUpdate({ x, y });
        })
        .onEnd(() => {
          'worklet';
          onEnd?.();
        }),
    [onUpdate, onEnd]
  );

  return pan;
};
