import { useMemo } from 'react';

import { SkPoint } from '@shopify/react-native-skia';
import {
  Gesture,
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStore } from '@model/useStore';

export type UseGestureProps = {
  isWorldMoveEnabled?: boolean;
  onUpdate: (point: SkPoint) => void;
  onEnd?: () => void | undefined;
};

const log = createLogger('useGesture');

export const useGesture = ({
  isWorldMoveEnabled = false,
  onUpdate,
  onEnd
}: UseGestureProps) => {
  const {
    mViewPosition,
    mViewScale,
    mViewBBox,
    screenToWorld,
    zoomOnPoint,
    viewLayout
  } = useStore();

  const startScale = useSharedValue(1);
  const startPosition = useSharedValue({ x: 0, y: 0 });

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
        })
        .minDistance(10),
    [isWorldMoveEnabled, onUpdate, onEnd]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(({ focalX, focalY }) => {
          'worklet';

          startScale.value = mViewScale.value;

          const x = focalX; // - viewLayout.width / 2;
          const y = focalY; // - viewLayout.height / 2;

          startPosition.value = { x, y };
          // pinchFocalPoint.value = [event.focalX, event.focalY];
          // runOnJS(log.debug)('onStart', x.toFixed(2), y.toFixed(2));
          // runOnJS(log.debug)('onStart', focalX.toFixed(2), focalY.toFixed(2));
        })
        .onUpdate(({ focalX, focalY, scale }) => {
          'worklet';

          const base = 1.2;
          const linearScale = startScale.value * scale;

          // ramp up the exponential scale so we don't get a jump in the zoom
          const bd = 1 + Math.min(base - 1, Math.abs(scale - 1));

          const newExpoScale = Math.pow(linearScale, bd);

          const toScale = newExpoScale;

          // note - focalPoint still not working
          // const focalPoint = startPosition.value;

          // runOnJS(log.debug)('onUpdate', bd.toFixed(2));

          runOnJS(zoomOnPoint)({ toScale, duration: 0 });
        }),
    // .onEnd(({ focalX, focalY }) => {
    //   // runOnJS(log.debug)('onEnd', focalX.toFixed(2), focalY.toFixed(2));
    // }),
    []
  );

  if (isWorldMoveEnabled) {
    return Gesture.Simultaneous(pan, pinchGesture);
  } else {
    return pan;
  }

  // return gesture;
};
