import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Canvas,
  Circle,
  Path,
  Rect,
  SkPoint,
  Skia,
  useCanvasRef
} from '@shopify/react-native-skia';
import Concaveman from 'concaveman';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  makeMutable,
  runOnJS,
  runOnUI,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useViewDims } from '@hooks/useViewDims';
import { simplify } from '../helpers/simplify';
import { useDualContourBrush } from './DualContourBrush';

const log = createLogger('Painter');

type vec2 = [number, number];

export const Painter = () => {
  const canvasRef = useCanvasRef();
  const { viewDims, setViewDims } = useViewDims();
  // const { addPoint, endBrush, points, brushSize, svgPath } =
  //   useDualContourBrush(viewDims);

  const { addPoint, svgPath, endBrush, hullPath } = usePointBrush();
  const pan = useGesture({ onUpdate: addPoint, onEnd: endBrush });

  return (
    <GestureDetector gesture={pan}>
      <Canvas
        style={styles.canvas}
        ref={canvasRef}
        onLayout={(event) => {
          setViewDims(event.nativeEvent.layout);
        }}
      >
        <Path path={svgPath} color='black' />
        <Path path={hullPath} color='red' />
      </Canvas>
    </GestureDetector>
  );
};

type UseGestureProps = {
  onUpdate: (point: SkPoint) => void;
  onEnd?: () => void | undefined;
};

const useGesture = ({ onUpdate, onEnd }: UseGestureProps) => {
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(({ x, y }) => {
          'worklet';
          // runOnJS(log.info)('start', { x, y });
        })
        .onUpdate(({ x, y }) => {
          'worklet';
          // runOnJS(log.info)('update', { x, y });
          onUpdate({ x, y });
        })
        .onEnd(() => {
          'worklet';
          runOnJS(log.info)('end');
          onEnd?.();
        }),
    [onUpdate, onEnd]
  );

  return pan;
};

const usePointBrush = () => {
  const svgPath = useSharedValue(Skia.Path.Make());
  const addTime = useSharedValue(Date.now());
  const points = useSharedValue<vec2[]>([]);
  const hullPath = useSharedValue(Skia.Path.Make());

  const generateConcaveHull = useCallback((points: vec2[]) => {
    const outcome = Concaveman(points, 4, 0) as vec2[];

    log.debug('[generateConcaveHull] concaveman', outcome.length);

    const simplified = simplify(outcome, 3, false);

    log.debug('[generateConcaveHull] simplify', simplified.length);

    runOnUI((hullPoints: vec2[]) => {
      hullPath.modify((hullPath) => {
        hullPath.reset();
        hullPath.moveTo(hullPoints[0][0], hullPoints[0][1]);
        for (let i = 1; i < hullPoints.length; i++) {
          hullPath.lineTo(hullPoints[i][0], hullPoints[i][1]);
        }
        hullPath.close();

        runOnJS(log.debug)('hullPath', hullPath.toSVGString());

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

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: 'cyan'
  }
});
