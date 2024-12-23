import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  Paint,
  Path,
  Skia,
  useCanvasRef
} from '@shopify/react-native-skia';
import { useContextBridge } from 'its-fine';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import {
  Debug,
  formatBBox,
  formatVector2,
  setDebugMsg1,
  setDebugMsg2
} from '@components/Debug/Debug';
import { FlowerMenu } from '@components/FlowerMenu/FlowerMenu';
import { PaletteBottomSheet } from '@components/PaletteBottomSheet/PaletteBottomSheet';
import { translateBrushFeature } from '@helpers/geo';
import { createLog } from '@helpers/log';
import { ActionType, BrushOperation } from '@model/types';
import {
  useStoreSelector,
  useStoreSetViewLayout,
  useStoreState,
  useStoreViewLayout
} from '@model/useStore';
import { BBox, BrushFeature, SkiaPathProps, Vector2 } from '@types';
import { BrushBottomSheet } from '../BrushBottomSheet';
import { GridComponent } from './GridComponent';
import { MiniMap } from './MiniMap';
import { ShapeComponent } from './ShapeComponent';
import { ShapeRenderer } from './ShapeRenderer';
import { useGesture } from './useGesture';
import { useMenu } from './useMenu';
import { useMoveShape } from './useMoveShape';
import { useMoveView } from './useMoveView';
import { useShapeBrush } from './useShapeBrush';

const log = createLog('Painter');

export const Painter = () => {
  const ContextBridge = useContextBridge();
  const canvasRef = useCanvasRef();

  const brushPath = useSharedValue(Skia.Path.Make());
  const [brushPathProps, setBrushPathProps] = useState<Partial<SkiaPathProps>>({
    color: 'lightgreen'
  });

  const {
    MenuProvider,
    // isWorldMoveEnabled,
    brushOperation,
    isPaletteOpen,
    setIsPaletteOpen,
    isBrushPaletteOpen,
    setIsBrushPaletteOpen
  } = useMenu();

  const setViewLayout = useStoreSetViewLayout();
  const viewLayout = useStoreViewLayout();
  const isPanViewEnabled = useStoreState().use.isPanViewEnabled();

  const resetFeatures = useStoreState().use.resetFeatures();
  const applyAction = useStoreState().use.applyAction();

  const brushColor = useStoreState().use.getBrushColor()();
  const setBrushColor = useStoreState().use.setBrushColor();

  const [mViewMatrix, mViewPosition, mViewScale, mViewBBox] = useStoreSelector(
    (state) => [
      state.mViewMatrix,
      state.mViewPosition,
      state.mViewScale,
      state.mViewBBox
    ]
  );

  const shapeHandlers = useShapeBrush({
    brushPath,
    setBrushPathProps
  });

  const { isMoveShapeEnabled, moveShape, moveShapeMatrix, ...moveHandlers } =
    useMoveShape();
  const moveViewHandlers = useMoveView();

  const gestureHandlers = useMemo(
    () =>
      isMoveShapeEnabled
        ? moveHandlers
        : isPanViewEnabled
          ? moveViewHandlers
          : shapeHandlers,
    [
      isMoveShapeEnabled,
      isPanViewEnabled,
      moveHandlers,
      moveViewHandlers,
      shapeHandlers
    ]
  );

  const handleTap = useStoreState().use.handleTap();
  const pan = useGesture({
    isPanViewEnabled,
    onTap: handleTap,
    ...gestureHandlers
  });

  const handleSelectColor = useCallback((color: string) => {
    log.debug('handleSelectColor', color);
    setIsPaletteOpen(false);
    setBrushColor(color);
  }, []);

  const handleSelectBrush = useCallback((brush: string) => {
    log.debug('handleSelectBrush', brush);
    setIsBrushPaletteOpen(false);
  }, []);

  // starting features
  useEffect(() => {
    applyAction({
      type: ActionType.ADD_BRUSH,
      feature: testFeature as BrushFeature,
      brushOperation: BrushOperation.ADD
    });
    applyAction({
      type: ActionType.ADD_BRUSH,
      feature: testFeature2 as BrushFeature,
      brushOperation: BrushOperation.ADD
    });

    return () => {
      resetFeatures();
    };
  }, []);

  useAnimatedReaction(
    () =>
      [mViewPosition.value, mViewScale.value, mViewBBox.value] as [
        Vector2,
        number,
        BBox
      ],
    ([position, scale, bbox]) => {
      setDebugMsg1(`${formatVector2(position)} ${scale.toString()}`);
      setDebugMsg2(`${formatBBox(bbox)}`);
    }
  );

  // useRenderingTrace('Painter', {
  //   isWorldMoveEnabled,
  //   brushOperation,
  //   viewLayout,
  //   addFeature,
  //   resetFeatures,
  //   handleTap,
  //   zoomOnPoint,
  //   setViewLayout,
  //   addPoint,
  //   brushPath,
  //   endBrush,
  //   pan
  // });

  // const svgPath = useDerivedValue(() => {
  //   const path = Skia.Path.MakeFromSVGString(shapes.circle.path);
  //   if (!path) return null;
  //   const it = Skia.ContourMeasureIter(path, false, 1);
  //   const contour = it.next();
  //   const totalLength = contour?.length() ?? 0;

  //   const polyLinePath = Skia.Path.Make();

  //   const divisions = 64;
  //   for (let ii = 0; ii < divisions; ii++) {
  //     const t = ii / divisions;
  //     const [pos] = contour?.getPosTan(t * totalLength);

  //     if (ii === 0) {
  //       polyLinePath.moveTo(pos.x, pos.y);
  //     } else {
  //       polyLinePath.lineTo(pos.x, pos.y);
  //     }
  //   }

  //   polyLinePath.close();

  //   return polyLinePath;
  // });

  return (
    <View style={styles.container}>
      <MenuProvider>
        <GestureDetector gesture={pan}>
          <Canvas
            style={styles.canvas}
            ref={canvasRef}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setViewLayout(width, height);
            }}
          >
            <ContextBridge>
              <Group
                matrix={mViewMatrix}
                // layer={
                //   <Paint>
                //     <Blur blur={10} />
                //     <ColorMatrix
                //       matrix={[
                //         1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
                //         18, -7
                //       ]}
                //     />
                //   </Paint>
                // }
              >
                <GridComponent />
                <ShapeRenderer />
              </Group>

              <MiniMap />

              <Path path={brushPath} {...brushPathProps} />

              {moveShape && (
                <Group matrix={moveShapeMatrix}>
                  <ShapeComponent shape={moveShape} />
                </Group>
              )}
            </ContextBridge>
          </Canvas>
        </GestureDetector>

        <FlowerMenu
          viewLayout={viewLayout}
          editNodeIsActive={!isPanViewEnabled}
          panNodeIsActive={isPanViewEnabled}
          brushOperationAddNodeIsActive={brushOperation === BrushOperation.ADD}
          brushOperationRemoveNodeIsActive={
            brushOperation === BrushOperation.SUBTRACT
          }
          brushOperationIntersectNodeIsActive={
            brushOperation === BrushOperation.INTERSECT
          }
          paletteNodeColor={brushColor}
        />

        <PaletteBottomSheet
          isOpen={isPaletteOpen}
          onColorSelected={handleSelectColor}
        />
        <BrushBottomSheet
          isOpen={isBrushPaletteOpen}
          onBrushSelected={handleSelectBrush}
        />
        <Debug />
      </MenuProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%'
  },
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EEE'
  }
});

const boxFeature: BrushFeature = {
  id: 'debug-a',
  type: 'Feature',
  bbox: [-50, -50, 50, 50],
  properties: {
    position: { x: 0, y: 0 },
    isLocal: false,
    color: '#F67280'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-50, -50],
        [50, -50],
        [50, 50],
        [-50, 50],
        [-50, -50]
      ]
    ]
  }
};

const testFeature = translateBrushFeature(
  boxFeature,
  { x: 0, y: -100 },
  { color: 'red', id: 'test-a' }
);
const testFeature2 = translateBrushFeature(
  boxFeature,
  { x: 0, y: 100 },
  { color: 'black', id: 'test-b' }
);
