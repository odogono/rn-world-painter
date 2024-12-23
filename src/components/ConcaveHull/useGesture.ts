import { useMemo } from 'react';

import {
  Gesture,
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStore } from '@model/useStore';
import { Vector2 } from '@types';

export type UseGestureProps = {
  isPanViewEnabled?: boolean;
  onTap?: (point: Vector2) => void;
  onStart?: (point: Vector2) => void;
  onChange?: (point: Vector2) => void;
  onUpdate?: (point: Vector2) => void;
  onEnd?: () => void | undefined;
};

const log = createLogger('useGesture');

export const useGesture = ({
  isPanViewEnabled = false,
  onStart,
  onChange,
  onUpdate,
  onEnd,
  onTap
}: UseGestureProps) => {
  const { mViewScale, screenToWorld, zoomOnPoint } = useStore();

  const startScale = useSharedValue(1);
  const startPosition = useSharedValue({ x: 0, y: 0 });

  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onStart(({ x, y }) => {
          const worldPos = screenToWorld({ x, y });

          if (onTap) {
            runOnJS(onTap)(worldPos);
          }
        }),
    [onTap, screenToWorld]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(({ x, y }) => {
          'worklet';

          startPosition.value = { x, y };

          if (onStart) {
            onStart({ x, y });
          }
          // runOnJS(log.info)('start', { x, y });
        })
        .onChange(({ changeX, changeY }) => {
          'worklet';
          if (onChange) {
            onChange({ x: changeX, y: changeY });
          }
        })
        .onUpdate(({ x, y }) => {
          'worklet';
          if (onUpdate) {
            onUpdate({ x, y });
          }
        })
        .onEnd(() => {
          'worklet';
          if (onEnd) {
            onEnd();
          }
        }),
    // .minDistance(10),
    [onStart, onChange, onUpdate, onEnd]
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

  return useMemo(() => {
    if (isPanViewEnabled) {
      return Gesture.Simultaneous(singleTap, pan, pinchGesture);
    } else {
      return Gesture.Simultaneous(singleTap, pan);
    }
  }, [singleTap, pan, pinchGesture, isPanViewEnabled]);
};
