import { useCallback, useEffect, useRef } from 'react';

import { SkPath, Skia } from '@shopify/react-native-skia';
import {
  SharedValue,
  runOnJS,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import shapes from '@assets/shapes.json';
import { generateConcaveHull } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { createBrushFeature, svgPathToBrushFeature } from '@model/brushFeature';
import {
  ActionType,
  BrushOperation,
  PaintMode,
  ShapeTemplate
} from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { BrushFeature, Position, Rect2, SkiaPathProps, Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

export type UseShapeBrushProps = {
  brushPath: SharedValue<SkPath>;
  setBrushPathProps: (props: Partial<SkiaPathProps>) => void;
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
  setBrushPathProps
}: UseShapeBrushProps) => {
  const rect = useSharedValue<Rect2>({ x: 0, y: 0, width: 0, height: 0 });
  const startPosition = useSharedValue<Vector2>({ x: 0, y: 0 });
  const shapeFeature = useSharedValue<BrushFeature | undefined>(undefined);
  const { screenToWorldPoints } = useStore();

  const brushColor = useStoreState().use.brushColor();
  const brushOperation = useStoreState().use.brushOperation();
  const brushShape = useStoreState().use.brushShape();
  const brushSize = useStoreState().use.brushSize();
  const paintMode = useStoreState().use.brushMode();

  const points = useSharedValue<Position[]>([]);
  const applyAction = useStoreState().use.applyAction();

  const brushColorSV = useDerivedValue(() => brushColor);
  const brushOperationSV = useDerivedValue(() => brushOperation);
  const brushShapeSV = useDerivedValue(() => brushShape);
  const brushSizeSV = useDerivedValue(() => brushSize);
  const paintModeSV = useDerivedValue(() => paintMode);

  // create the brush feature from the shape
  const initShapeFeature = useCallback(() => {
    const shape = shapes[brushShapeSV.value];
    shapeFeature.value = svgPathToBrushFeature({
      path: shape.path,
      properties: { color: brushColorSV.value },
      divisions: 24
    });
  }, []);

  const applyShape = useCallback(() => {
    let applyPoints = points.value;

    if (paintModeSV.value === PaintMode.PAINT) {
      applyPoints = generateConcaveHull({
        points: applyPoints,
        concavity: 3,
        minArea: 20,
        simplify: false,
        simplifyTolerance: 6,
        simplifyHighQuality: true
      });
    }

    log.debug('[applyShape] applyPoints', brushColorSV.value);

    const feature = createBrushFeature({
      points: applyPoints,
      isLocal: false,
      properties: { color: brushColorSV.value }
    });

    // translate the feature coordinates from screen to world
    const featurePoints = feature.geometry.coordinates[0] as Position[];
    const worldPoints = screenToWorldPoints(featurePoints);
    feature.geometry.coordinates[0] = worldPoints;

    applyAction({
      type: ActionType.ADD_BRUSH,
      feature,
      brushOperation: brushOperationSV.value,
      options: { updateBBox: true }
    });

    points.value = [];
  }, [screenToWorldPoints, applyAction, paintMode]);

  const start = useCallback(({ x, y }: Vector2) => {
    'worklet';

    runOnJS(initShapeFeature)();

    const style = paintModeSV.value === PaintMode.PAINT ? 'fill' : 'stroke';
    const strokeWidth = paintModeSV.value === PaintMode.PAINT ? 0 : 2;

    runOnJS(setBrushPathProps)({
      color: brushColorSV.value,
      style,
      strokeWidth
    });

    startPosition.value = { x, y };
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

      const scaleX = rectWidth / shapeWidth;
      const scaleY = rectHeight / shapeHeight;

      for (let ii = 0; ii < shapePoints.length; ii++) {
        let [px, py] = shapePoints[ii];

        px *= scaleX;
        py *= scaleY;

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

  const updatePaint = useCallback(({ x, y }: Vector2) => {
    'worklet';

    const brushSize = brushSizeSV.value;

    const rectX = x - brushSize / 2;
    const rectY = y - brushSize / 2;
    const rectWidth = brushSize;
    const rectHeight = brushSize;

    const shapeBbox = shapeFeature.value?.bbox ?? [0, 0, 0, 0];
    const shapeWidth = shapeBbox[2] - shapeBbox[0];
    const shapeHeight = shapeBbox[3] - shapeBbox[1];

    const scaleX = rectWidth / shapeWidth;
    const scaleY = rectHeight / shapeHeight;

    brushPath.modify((p) => {
      const shapePoints =
        (shapeFeature.value?.geometry.coordinates[0] as Position[]) ?? [];

      for (let ii = 0; ii < shapePoints.length; ii++) {
        let [px, py] = shapePoints[ii];

        px *= scaleX;
        py *= scaleY;

        // translate the points to the rect position and scale them so that the fit the rect
        px += rectX;
        py += rectY;

        points.value = [...points.value, [px, py]];

        p.addCircle(px, py, 1);
      }

      return p;
    });

    // points.value = [...points.value, [x, y]];
  }, []);

  // const addPoint = useCallback(({ x, y }: Vector2) => {
  //   'worklet';

  //   points.value = [...points.value, [x, y]];
  // }, []);

  const end = useCallback(() => {
    'worklet';

    brushPath.modify((path) => {
      path.reset();
      return path;
    });

    runOnJS(applyShape)();
  }, []);

  return {
    onStart: start,
    onUpdate: paintModeSV.value === PaintMode.PAINT ? updatePaint : update,
    onEnd: end
  };
};
