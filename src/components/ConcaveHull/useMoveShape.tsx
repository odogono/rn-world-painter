import { useCallback, useEffect, useRef, useState } from 'react';

import { SkMatrix, Skia } from '@shopify/react-native-skia';
import {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { createLog } from '@helpers/log';
import {
  copyBrushFeature,
  translateAbsoluteBrushFeature
} from '@model/brushFeature';
import { ActionType } from '@model/types';
import { useStore, useStoreSelector, useStoreState } from '@model/useStore';
import { BrushFeature, Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

export type UseMoveResult = UseGestureProps & {
  moveShape: BrushFeature | null;
  moveShapeMatrix: SharedValue<SkMatrix>;
  isMoveShapeEnabled: boolean;
};

const log = createLog('useMove');

export const useMoveShape = (): UseMoveResult => {
  const moveShapeMatrix = useSharedValue(Skia.Matrix());
  const moveShapeStartPosition = useSharedValue({ x: 0, y: 0 });
  const moveShapePosition = useSharedValue({ x: 0, y: 0 });
  const [moveShape, setMoveShape] = useState<BrushFeature | null>(null);

  const mViewScale = useStoreSelector((state) => state.mViewScale);

  const selectedFeature = useStoreState().use.getSelectedFeature()();

  // used to remember the selected feature across the gesture
  const selectedFeatureRef = useRef(selectedFeature);

  const { screenToWorld } = useStore();
  const getFeatureIdsByPosition = useStoreState().use.getFeatureIdsByPosition();
  const clearSelectedFeatures = useStoreState().use.clearSelectedFeatures();
  const removeFeatureImmediate = useStoreState().use.removeFeatureImmediate();

  const applyAction = useStoreState().use.applyAction();
  const brushOperation = useStoreSelector((state) => state.brushOperation);
  const brushOperationRef = useRef(brushOperation);

  const isMoveShapeEnabled =
    selectedFeature !== undefined || selectedFeatureRef.current !== undefined;

  // again, the brushOperation value does not propogate to the unMountMoveShape
  // callback, so we have to store it in a ref
  useEffect(() => {
    brushOperationRef.current = brushOperation;
  }, [brushOperation]);

  const mountMoveShape = useCallback(
    ({ x, y }: Vector2) => {
      if (!selectedFeature) {
        log.debug('useMove no selected feature');
        return;
      }

      const worldPoint = screenToWorld({ x, y });

      const shapeIdsAtPosition = getFeatureIdsByPosition(worldPoint);

      log.debug(
        `[mountMoveShape] ${selectedFeature.id} shapeIdsAtPosition`,
        shapeIdsAtPosition
      );

      if (
        shapeIdsAtPosition.length === 0 ||
        !shapeIdsAtPosition.includes(selectedFeature.id as string)
      ) {
        log.debug(`[mountMoveShape] ${selectedFeature.id} not hit`);
        clearSelectedFeatures();
        return;
      }

      const centered = translateAbsoluteBrushFeature(selectedFeature);

      selectedFeatureRef.current = selectedFeature;
      setMoveShape(centered);
      removeFeatureImmediate(selectedFeature);
    },
    [selectedFeature]
  );

  const unmountMoveShape = useCallback(() => {
    if (!selectedFeatureRef.current) return;

    const worldPoint = screenToWorld(moveShapePosition.value);

    applyAction({
      type: ActionType.MOVE_BRUSH,
      brushOperation: brushOperationRef.current,
      feature: copyBrushFeature(selectedFeatureRef.current),
      translation: { x: worldPoint.x, y: worldPoint.y },
      options: {
        selectFeature: true
      }
    });

    selectedFeatureRef.current = undefined;
    setMoveShape(null);
  }, []);

  useAnimatedReaction(
    () => moveShapePosition.value,
    (position) => {
      const { x, y } = position;
      moveShapeMatrix.modify((m) => {
        m.identity();
        m.translate(x, y);

        m.scale(mViewScale.value, mViewScale.value);
        return m;
      });
    }
  );

  const onStart = useCallback(
    ({ x, y }: Vector2) => {
      'worklet';

      // remove the selected shape from the world
      runOnJS(mountMoveShape)({ x, y });

      moveShapePosition.value = { x, y };
      moveShapeStartPosition.value = { x, y };

      // start the move
      runOnJS(log.debug)(`[startMove] ${selectedFeature?.id}`, { x, y });
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

    runOnJS(log.debug)('onEnd');
  }, []);

  return {
    isMoveShapeEnabled,
    onStart,
    onChange,
    onEnd,
    moveShapeMatrix,
    moveShape
  };
};
