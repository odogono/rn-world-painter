import { useCallback, useEffect, useRef } from 'react';

import { SkPath, Skia } from '@shopify/react-native-skia';
import Concaveman from 'concaveman';
import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';

import { useRemoteLogContext } from '@contexts/RemoteLogContext';
import { featureGeometryToLocal } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { simplify } from '@helpers/simplify';
import { createBrushFeature } from '@model/brushFeature';
import { ActionType, BrushMode } from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { Position, Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

const log = createLogger('usePointBrush');

export type UsePointBrushProps = {
  brushMode: BrushMode;
  brushPath: SharedValue<SkPath>;
};

export type UsePointBrushResult = UseGestureProps;

export const usePointBrush = ({
  brushPath,
  brushMode = BrushMode.ADD
}: UsePointBrushProps): UsePointBrushResult => {
  const addTime = useSharedValue(Date.now());
  const points = useSharedValue<Position[]>([]);
  const brushModeRef = useRef<BrushMode>(brushMode);
  const getBrushColor = useStoreState().use.getBrushColor();

  // const rlog = useRemoteLogContext();
  const { screenToWorldPoints } = useStore();

  const applyAction = useStoreState().use.applyAction();

  const brushSize = useSharedValue(30);
  const brushResolution = useSharedValue(16);

  const generateConcaveHull = useCallback((points: Position[]) => {
    // todo move into BrushFeature
    const outcome = Concaveman(points, 3, 20) as Position[];

    // log.debug('[generateConcaveHull] concaveman', outcome.length);

    // todo move into BrushFeature
    const simplified = outcome; //simplify(outcome, 6, true);

    // log.debug('[generateConcaveHull] simplify', simplified.length);

    // create a geojson feature
    const feature = createBrushFeature({
      points: simplified,
      isLocal: false,
      properties: {
        color: getBrushColor()
      }
    });
    log.debug('[generateConcaveHull] created brush', feature.id);

    // convert to world coordinates
    const featurePoints = feature.geometry.coordinates[0] as Position[];
    const worldPoints = screenToWorldPoints(featurePoints);
    feature.geometry.coordinates[0] = worldPoints;

    applyAction({
      type: ActionType.ADD_BRUSH,
      feature,
      brushMode: brushModeRef.current,
      options: { updateBBox: true }
    });

    return outcome;
  }, []);

  useEffect(() => {
    // infuriating - the brushMode prop does not make it
    // to the generateConcaveHull callback - even with a dep set
    // so we have to use a ref to update the brushMode
    brushModeRef.current = brushMode;
  }, [brushMode]);

  const addPoint = useCallback(({ x, y }: Vector2) => {
    'worklet';

    const time = Date.now();

    if (addTime.value + 10 > time) {
      return;
    }

    addTime.value = time;

    brushPath.modify((path) => {
      // add 12 points in a circle around the x and y
      for (let i = 0; i < brushResolution.value; i++) {
        const angle = (Math.PI * 2) / brushResolution.value;
        const px = x + Math.cos(i * angle) * brushSize.value;
        const py = y + Math.sin(i * angle) * brushSize.value;

        points.value = [...points.value, [px, py]];

        path.addCircle(px, py, 1);
      }

      return path;
    });
  }, []);

  const onEnd = useCallback(() => {
    'worklet';

    // runOnJS(log.info)('endBrush', points.value.length);

    brushPath.modify((path) => {
      path.reset();
      return path;
    });

    runOnJS(generateConcaveHull)(points.value);

    points.value = [];
  }, []);

  return { onStart: addPoint, onUpdate: addPoint, onEnd };
};
