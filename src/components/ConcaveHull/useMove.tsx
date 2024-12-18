import { useCallback, useEffect, useState } from 'react';

import { SkMatrix, Skia } from '@shopify/react-native-skia';
import {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStore, useStoreState } from '@model/useStore';
import { BrushFeature, Vector2 } from '@types';
import { centerBrushFeature } from '../../model/brushFeature';
import { UseGestureProps } from './useGesture';

export type UseMoveResult = UseGestureProps & {
  moveShape: BrushFeature | null;
  moveShapeMatrix: SharedValue<SkMatrix>;
  isMoveShapeEnabled: boolean;
};

const log = createLogger('useMove');

export const useMove = (): UseMoveResult => {
  const moveShapeMatrix = useSharedValue(Skia.Matrix());
  const moveShapePosition = useSharedValue({ x: 0, y: 0 });
  const [moveShape, setMoveShape] = useState<BrushFeature | null>(null);

  const { screenToWorld } = useStore();
  const getFeatureIdsByPosition = useStoreState().use.getFeatureIdsByPosition();
  const selectedFeature = useStoreState().use.getSelectedFeature()();
  const clearSelectedFeatures = useStoreState().use.clearSelectedFeatures();

  const mountMoveShape = useCallback(
    ({ x, y }: Vector2) => {
      if (!selectedFeature) return;

      const worldPoint = screenToWorld({ x, y });

      const shapeIdsAtPosition = getFeatureIdsByPosition(worldPoint);

      if (
        shapeIdsAtPosition.length === 0 ||
        !shapeIdsAtPosition.includes(selectedFeature.id as string)
      ) {
        log.debug(`useMove ${selectedFeature.id} not hit`);
        // setIsMoveShapeEnabled(false);
        clearSelectedFeatures();
        return;
      }

      const centered = centerBrushFeature(selectedFeature);
      log.debug(`useMove ${selectedFeature.id} centered`, centered.bbox);

      // setIsMoveShapeEnabled(true);
      setMoveShape(centered);
    },
    [selectedFeature]
  );

  const unmountMoveShape = useCallback(() => {
    setMoveShape(null);
  }, []);

  useAnimatedReaction(
    () => moveShapePosition.value,
    (position) => {
      const { x, y } = position;
      moveShapeMatrix.modify((m) => {
        m.identity();
        m.translate(x, y);
        return m;
      });
    }
  );

  const onStart = useCallback(
    ({ x, y }: Vector2) => {
      'worklet';

      // remove the selected shape from the world
      runOnJS(mountMoveShape)({ x, y });

      moveShapePosition.modify((p) => {
        p.x = x;
        p.y = y;
        return p;
      });

      // start the move
      runOnJS(log.debug)(`startMove ${selectedFeature?.id}`, { x, y });
    },
    [selectedFeature]
  );

  const onChange = useCallback(({ x, y }: Vector2) => {
    'worklet';

    moveShapePosition.modify((p) => {
      p.x += x;
      p.y += y;
      return p;
    });

    // runOnJS(log.debug)('updateMove', { x, y });
  }, []);

  const onEnd = useCallback(() => {
    'worklet';

    // add the shape back to the world
    runOnJS(unmountMoveShape)();

    runOnJS(log.debug)('endMove');
  }, []);

  return {
    isMoveShapeEnabled: selectedFeature !== undefined,
    onStart,
    onChange,
    onEnd,
    moveShapeMatrix,
    moveShape
  };
};
