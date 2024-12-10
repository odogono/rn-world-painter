import { useCallback } from 'react';

import { SkPoint, Skia } from '@shopify/react-native-skia';
import Concaveman from 'concaveman';
import { runOnJS, runOnUI, useSharedValue } from 'react-native-reanimated';

import { useRemoteLogContext } from '@contexts/RemoteLogContext';
import { createLogger } from '@helpers/log';
import { simplify } from '@helpers/simplify';
import { vec2 } from '@types';

const log = createLogger('usePointBrush');

export const usePointBrush = () => {
  const svgPath = useSharedValue(Skia.Path.Make());
  const addTime = useSharedValue(Date.now());
  const points = useSharedValue<vec2[]>([]);
  const hullPath = useSharedValue(Skia.Path.Make());
  const rlog = useRemoteLogContext();

  const generateConcaveHull = useCallback((points: vec2[]) => {
    const outcome = Concaveman(points, 4, 0) as vec2[];

    log.debug('[generateConcaveHull] concaveman', outcome.length);

    const simplified = simplify(outcome, 3, false);

    log.debug('[generateConcaveHull] simplify', simplified.length);

    rlog.sendMessage(
      `[generateConcaveHull] generated hull ${outcome.length} / ${simplified.length}`
    );

    runOnUI((hullPoints: vec2[]) => {
      hullPath.modify((hullPath) => {
        hullPath.reset();
        hullPath.moveTo(hullPoints[0][0], hullPoints[0][1]);
        for (let i = 1; i < hullPoints.length; i++) {
          hullPath.lineTo(hullPoints[i][0], hullPoints[i][1]);
        }
        hullPath.close();

        const bounds = hullPath.computeTightBounds();

        // runOnJS(log.debug)('hullPath', hullPath.toSVGString());

        runOnJS(rlog.sendSVGPath)({
          name: 'hull',
          bounds,
          path: hullPath.toSVGString()
        });

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
      // add 5 points in a circle around the x and y
      for (let i = 0; i < 12; i++) {
        const px = x + Math.cos((i * Math.PI) / 6) * 10;
        const py = y + Math.sin((i * Math.PI) / 6) * 10;

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
