import { useCallback, useEffect, useRef } from 'react';

import { SkPoint, Skia } from '@shopify/react-native-skia';
import Concaveman from 'concaveman';
import { runOnJS, runOnUI, useSharedValue } from 'react-native-reanimated';

import { useRemoteLogContext } from '@contexts/RemoteLogContext';
import { featureGeometryToLocal } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { simplify } from '@helpers/simplify';
import { createBrushFeature } from '@model/brushFeature';
import { ActionType, BrushMode } from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { BrushFeature, Position } from '@types';

const log = createLogger('usePointBrush');

export type UsePointBrushProps = {
  brushMode: BrushMode;
};

export const usePointBrush = ({
  brushMode = BrushMode.ADD
}: UsePointBrushProps) => {
  const brushPath = useSharedValue(Skia.Path.Make());
  const addTime = useSharedValue(Date.now());
  const points = useSharedValue<Position[]>([]);
  const brushModeRef = useRef<BrushMode>(brushMode);

  const rlog = useRemoteLogContext();
  const { screenToWorldPoints } = useStore();

  // const { addFeature } = useStoreActions();
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
      isLocal: false
    });
    log.debug('[generateConcaveHull] created brush', feature.id);

    // runOnUI((feature: BrushFeature) => {
    const featurePoints = feature.geometry.coordinates[0];

    const worldPoints = screenToWorldPoints(featurePoints as Position[]);

    feature.geometry.coordinates[0] = worldPoints;

    // runOnJS(addFeature)(feature, {
    //   updateBBox: true,
    //   BrushMode: brushMode
    // });

    applyAction({
      type: ActionType.ADD_BRUSH,
      feature,
      brushMode: brushModeRef.current,
      options: { updateBBox: true }
    });

    // addFeature(feature, {
    //   updateBBox: true,
    //   // note - for some reason, the brushMode prop does not update here
    //   BrushMode: brushModeRef.current
    // });

    return outcome;
  }, []);

  useEffect(() => {
    // infuriating - the brushMode prop does not make it
    // to the generateConcaveHull callback - even with a dep set
    // so we have to use a ref to update the brushMode
    brushModeRef.current = brushMode;
  }, [brushMode]);

  const addPoint = useCallback(({ x, y }: SkPoint) => {
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

  const endBrush = useCallback(() => {
    'worklet';

    // runOnJS(log.info)('endBrush', points.value.length);

    brushPath.modify((path) => {
      path.reset();
      return path;
    });

    runOnJS(generateConcaveHull)(points.value);

    points.value = [];
  }, []);

  return { brushPath, addPoint, endBrush };
};
