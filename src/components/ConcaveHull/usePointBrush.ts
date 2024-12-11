import { useCallback } from 'react';

import { SkPoint, Skia } from '@shopify/react-native-skia';
import Concaveman from 'concaveman';
import { runOnJS, runOnUI, useSharedValue } from 'react-native-reanimated';

import { useRemoteLogContext } from '@contexts/RemoteLogContext';
import { createLogger } from '@helpers/log';
import { simplify } from '@helpers/simplify';
import { Position } from '@types';
import { createBrushFeature } from '../../model/brushFeature';

const log = createLogger('usePointBrush');

export const usePointBrush = () => {
  const svgPath = useSharedValue(Skia.Path.Make());
  const addTime = useSharedValue(Date.now());
  const points = useSharedValue<Position[]>([]);
  const hullPath = useSharedValue(Skia.Path.Make());
  const rlog = useRemoteLogContext();

  const brushSize = useSharedValue(30);
  const brushResolution = useSharedValue(16);

  const generateConcaveHull = useCallback((points: Position[]) => {
    const outcome = Concaveman(points, 3, 20) as Position[];

    log.debug('[generateConcaveHull] concaveman', outcome.length);

    const simplified = simplify(outcome, 6, true);

    log.debug('[generateConcaveHull] simplify', simplified.length);

    // create a geojson feature
    const feature = createBrushFeature({
      points: simplified,
      isLocal: true
    });

    log.debug('[generateConcaveHull] feature', feature);

    runOnUI((hullPoints: Position[]) => {
      hullPath.modify((hullPath) => {
        hullPath.reset();
        hullPath.moveTo(hullPoints[0][0], hullPoints[0][1]);
        for (let i = 1; i < hullPoints.length; i++) {
          hullPath.lineTo(hullPoints[i][0], hullPoints[i][1]);
        }
        hullPath.close();

        // const bounds = hullPath.computeTightBounds();

        // hullPath.toCmds();

        // runOnJS(log.debug)('hullPath', hullPath.toCmds());

        // runOnJS(rlog.sendSVGPath)({
        //   name: 'hull',
        //   bounds,
        //   path: hullPath.toSVGString()
        // });

        return hullPath;
      });
      // log.debug('generateConcaveHull', outcome);
    })(simplified);

    return outcome;
  }, []);

  // const brushSize = useSharedValue(20);

  const addPoint = useCallback(({ x, y }: SkPoint) => {
    'worklet';

    const time = Date.now();

    if (addTime.value + 10 > time) {
      return;
    }

    addTime.value = time;

    svgPath.modify((path) => {
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

    runOnJS(log.info)('endBrush', points.value.length);

    svgPath.modify((path) => {
      path.reset();
      return path;
    });

    runOnJS(generateConcaveHull)(points.value);

    points.value = [];
  }, []);

  return { svgPath, addPoint, endBrush, hullPath };
};
