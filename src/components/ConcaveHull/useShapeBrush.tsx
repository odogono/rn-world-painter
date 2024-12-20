import { useCallback, useEffect, useRef } from 'react';

import { SkPath, Skia } from '@shopify/react-native-skia';
import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';

import shapes from '@assets/shapes.json';
import { generateConcaveHull } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { createBrushFeature, svgPathToBrushFeature } from '@model/brushFeature';
import { ActionType, BrushMode } from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { BrushFeature, Position, Rect2, SkiaPathProps, Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

type Shape = keyof typeof shapes;

export type UseShapeBrushProps = {
  brushMode: BrushMode;
  brushPath: SharedValue<SkPath>;
  setBrushPathProps: (props: Partial<SkiaPathProps>) => void;
  shapeId?: Shape;
};

export type UseShapeBrushResult = UseGestureProps;

const log = createLogger('useShapeBrush');

/**
 * Draws a selection box based on the drag position
 *
 *
 * @param props
 * @returns
 */
export const useShapeBrush = ({
  brushPath,
  brushMode,
  setBrushPathProps,
  shapeId = 'bluesky'
}: UseShapeBrushProps) => {
  const rect = useSharedValue<Rect2>({ x: 0, y: 0, width: 0, height: 0 });
  const startPosition = useSharedValue<Vector2>({ x: 0, y: 0 });
  const shapeFeature = useSharedValue<BrushFeature | undefined>(undefined);
  const { screenToWorldPoints } = useStore();
  const brushColor = useStoreState().use.brushColor();
  const brushColorRef = useRef<string>(brushColor);
  const points = useSharedValue<Position[]>([]);
  const brushModeRef = useRef<BrushMode>(brushMode);
  const applyAction = useStoreState().use.applyAction();

  const isPainting = false;

  useEffect(() => {
    // infuriating - the brushMode prop does not make it
    // to the generateConcaveHull callback - even with a dep set
    // so we have to use a ref to update the brushMode
    brushModeRef.current = brushMode;
    brushColorRef.current = brushColor;
  }, [brushMode, brushColor]);

  const initShapeFeature = useCallback(() => {
    const shape = shapes[shapeId];
    shapeFeature.value = svgPathToBrushFeature({
      path: shape.path,
      properties: { color: brushColor }
    });
  }, [shapeId, brushColor]);

  const applyShape = useCallback(() => {
    let applyPoints = points.value;

    if (isPainting) {
      applyPoints = generateConcaveHull({
        points: applyPoints,
        concavity: 3,
        minArea: 20,
        simplify: false,
        simplifyTolerance: 6,
        simplifyHighQuality: true
      });
    }

    const feature = createBrushFeature({
      points: applyPoints,
      isLocal: false,
      properties: { color: brushColorRef.current }
    });

    const featurePoints = feature.geometry.coordinates[0] as Position[];
    const worldPoints = screenToWorldPoints(featurePoints);
    feature.geometry.coordinates[0] = worldPoints;

    applyAction({
      type: ActionType.ADD_BRUSH,
      feature,
      brushMode: brushModeRef.current,
      options: { updateBBox: true }
    });
  }, [screenToWorldPoints, applyAction]);

  const start = useCallback(({ x, y }: Vector2) => {
    'worklet';

    runOnJS(initShapeFeature)();

    brushPath.modify((p) => {
      p.reset();
      return p;
    });

    runOnJS(setBrushPathProps)({
      color: 'lightblue',
      style: 'stroke',
      strokeWidth: 2
    });

    startPosition.value = { x, y };
    // rect.value = { x, y, width: 1, height: 1 };

    runOnJS(log.debug)('[start]');
  }, []);
  const update = useCallback(({ x, y }: Vector2) => {
    'worklet';

    points.value = [];

    let {
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight
    } = rect.value;

    const { x: startX, y: startY } = startPosition.value;

    if (x > startX) {
      rectWidth = x - startX;
    } else if (x <= startX) {
      rectWidth = startX - x;
      rectX = x;
    }

    if (y > startY) {
      rectHeight = y - startY;
    } else if (y <= startY) {
      rectHeight = startY - y;
      rectY = y;
    }

    rect.value = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };

    brushPath.modify((p) => {
      p.reset();

      const shapePoints =
        (shapeFeature.value?.geometry.coordinates[0] as Position[]) ?? [];

      const shapeBbox = shapeFeature.value?.bbox ?? [0, 0, 0, 0];
      const shapeWidth = shapeBbox[2] - shapeBbox[0];
      const shapeHeight = shapeBbox[3] - shapeBbox[1];

      for (let ii = 0; ii < shapePoints.length; ii++) {
        let [px, py] = shapePoints[ii];

        px *= rectWidth / shapeWidth;
        py *= rectHeight / shapeHeight;

        // translate the points to the rect position and scale them so that the fit the rect
        px += rectX;
        py += rectY;

        points.value = [...points.value, [px, py]];

        if (ii === 0) {
          p.moveTo(px, py);
        } else {
          p.lineTo(px, py);
        }
      }

      p.close();

      return p;
    });

    // close the shape to have valid geometry
    points.value = [...points.value, points.value[0]];
  }, []);

  const end = useCallback(() => {
    'worklet';

    brushPath.modify((path) => {
      path.reset();
      return path;
    });

    runOnJS(applyShape)();
  }, []);

  return { onStart: start, onUpdate: update, onEnd: end };
};
