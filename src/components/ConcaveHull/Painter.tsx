import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Canvas, Group, Path, useCanvasRef } from '@shopify/react-native-skia';
import { useContextBridge } from 'its-fine';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction } from 'react-native-reanimated';

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
import { createLogger } from '@helpers/log';
import { ActionType, BrushMode } from '@model/types';
import {
  useStore,
  useStoreSelector,
  useStoreSetViewLayout,
  useStoreState,
  useStoreViewLayout
} from '@model/useStore';
import { BBox, BrushFeature, Vector2 } from '@types';
import { MiniMap } from './MiniMap';
import { ShapeComponent } from './ShapeComponent';
import { ShapeRenderer } from './ShapeRenderer';
import { useGesture } from './useGesture';
import { useMenu } from './useMenu';
import { useMoveShape } from './useMoveShape';
import { useMoveView } from './useMoveView';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

export const Painter = () => {
  const ContextBridge = useContextBridge();
  const canvasRef = useCanvasRef();

  const {
    MenuProvider,
    isWorldMoveEnabled,
    brushMode,
    isPaletteOpen,
    setIsPaletteOpen
  } = useMenu();

  const setViewLayout = useStoreSetViewLayout();
  const viewLayout = useStoreViewLayout();

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

  const { brushPath, ...brushHandlers } = usePointBrush({ brushMode });
  const { isMoveShapeEnabled, moveShape, moveShapeMatrix, ...moveHandlers } =
    useMoveShape();
  const moveViewHandlers = useMoveView();

  const gestureHandlers = isMoveShapeEnabled
    ? moveHandlers
    : isWorldMoveEnabled
      ? moveViewHandlers
      : brushHandlers;

  const handleTap = useStoreState().use.handleTap();
  const pan = useGesture({
    isWorldMoveEnabled,
    onTap: handleTap,
    ...gestureHandlers
  });

  const handleSelectColor = useCallback((color: string) => {
    log.debug('handleSelectColor', color);
    setIsPaletteOpen(false);
    setBrushColor(color);
  }, []);

  // starting features
  useEffect(() => {
    applyAction({
      type: ActionType.ADD_BRUSH,
      feature: testFeature as BrushFeature,
      brushMode: BrushMode.ADD
    });
    applyAction({
      type: ActionType.ADD_BRUSH,
      feature: testFeature2 as BrushFeature,
      brushMode: BrushMode.ADD
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
  //   brushMode,
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
              <Group matrix={mViewMatrix}>
                <ShapeRenderer />
              </Group>

              <MiniMap />

              <Path path={brushPath} color='black' />

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
          editNodeIsActive={!isWorldMoveEnabled}
          panNodeIsActive={isWorldMoveEnabled}
          brushAddNodeIsActive={brushMode === BrushMode.ADD}
          brushRemoveNodeIsActive={brushMode === BrushMode.SUBTRACT}
          paletteNodeColor={brushColor}
        />

        <PaletteBottomSheet
          isOpen={isPaletteOpen}
          onColorSelected={handleSelectColor}
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
