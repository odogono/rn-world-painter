import { useMemo } from 'react';

import { SkPoint } from '@shopify/react-native-skia';
import { Gesture } from 'react-native-gesture-handler';

import { useStore } from '@model/useStore';

export type UseGestureProps = {
  isWorldMoveEnabled?: boolean;
  onUpdate: (point: SkPoint) => void;
  onEnd?: () => void | undefined;
};

export const useGesture = ({
  isWorldMoveEnabled = false,
  onUpdate,
  onEnd
}: UseGestureProps) => {
  const { mViewPosition, mViewBBox, screenToWorld, zoomOnPoint } = useStore();

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(({ x, y }) => {
          'worklet';

          if (isWorldMoveEnabled) {
            // onUpdate({ x, y });
          } else {
            onUpdate({ x, y });
          }
          // runOnJS(log.info)('start', { x, y });
        })
        .onChange(({ changeX, changeY }) => {
          'worklet';
          if (!isWorldMoveEnabled) {
            return;
          }
          // const { x, y } = mViewPosition.value;
          mViewPosition.modify((pos) => {
            pos.x -= changeX;
            pos.y -= changeY;
            return pos;
          });
          // mViewPosition.value = { x: x - changeX, y: y - changeY };
        })
        .onUpdate(({ x, y }) => {
          'worklet';
          // runOnJS(log.info)('update', { x, y });
          if (isWorldMoveEnabled) {
            // onUpdate({ x, y });
          } else {
            onUpdate({ x, y });
          }
        })
        .onEnd(() => {
          'worklet';

          if (isWorldMoveEnabled) {
            // onEnd?.();
          } else {
            onEnd?.();
          }
        }),
    [isWorldMoveEnabled, onUpdate, onEnd]
  );

  return pan;
};
