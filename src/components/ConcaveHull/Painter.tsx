import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Canvas,
  Group,
  Path,
  Rect,
  SkPath,
  Skia,
  useCanvasRef
} from '@shopify/react-native-skia';
import { useContextBridge } from 'its-fine';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';

import {
  Debug,
  formatBBox,
  formatVector2,
  setDebugMsg1,
  setDebugMsg2,
  setDebugMsg3
} from '@components/Debug/Debug';
import { FlowerMenu } from '@components/FlowerMenu/FlowerMenu';
import { useEvents } from '@contexts/Events';
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
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature, Vector2 } from '@types';
import { FlowerMenuStoreProvider } from '../FlowerMenu/store/context';
import { MiniMap } from './MiniMap';
import { ShapeRenderer } from './ShapeRenderer';
import { useGesture } from './useGesture';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

export const Painter = () => {
  const ContextBridge = useContextBridge();
  const canvasRef = useCanvasRef();
  const [isWorldMoveEnabled, setIsWorldMoveEnabled] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.ADD);
  const { addPoint, brushPath, endBrush } = usePointBrush({ brushMode });
  const setViewLayout = useStoreSetViewLayout();
  const viewLayout = useStoreViewLayout();
  const { zoomOnPoint } = useStore();
  const { resetFeatures, handleTap } = useStoreActions();
  const applyAction = useStoreState().use.applyAction();
  const removeSelectedFeatures = useStoreState().use.removeSelectedFeatures();
  const undo = useStoreState().use.undo();
  const redo = useStoreState().use.redo();

  const [mViewMatrix, mViewPosition, mViewScale, mViewBBox] = useStoreSelector(
    (state) => [
      state.mViewMatrix,
      state.mViewPosition,
      state.mViewScale,
      state.mViewBBox
    ]
  );

  const pan = useGesture({
    isWorldMoveEnabled,
    onTap: handleTap,
    onUpdate: addPoint,
    onEnd: endBrush
  });

  const onNodeSelect = useCallback(({ id }: { id: string }) => {
    log.debug('[Painter][onNodeSelect]', id);
    switch (id) {
      case 'edit':
        setIsWorldMoveEnabled(false);
        break;
      case 'pan':
        setIsWorldMoveEnabled(true);
        break;
      case 'zoomIn':
        zoomOnPoint({ zoomFactor: 4 });
        break;
      case 'zoomOut':
        zoomOnPoint({ zoomFactor: 0.5 });
        break;
      case 'reset':
        zoomOnPoint({ toScale: 1 });
        break;
      case 'brushAdd':
        setBrushMode(BrushMode.ADD);
        break;
      case 'brushRemove':
        setBrushMode(BrushMode.SUBTRACT);
        break;
      case 'brushDelete':
        removeSelectedFeatures();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
    }
  }, []);

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
      <FlowerMenuStoreProvider
        insets={{ left: 10, top: 64, right: 10, bottom: 50 }}
        // onEvent={onFlowerMenuEvent}
        onNodeSelect={onNodeSelect}
      >
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
                {/* <Rect x={-15} y={-15} width={30} height={30} color='red' />
              <Rect x={-15} y={-15 + 60} width={30} height={30} color='black' /> */}

                <ShapeRenderer />

                {/* <Group matrix={shapeMatrix}>
              <Path path={hullPath} color='#444' />
            </Group> */}
              </Group>

              <MiniMap />

              <Path path={brushPath} color='black' />
            </ContextBridge>
          </Canvas>
        </GestureDetector>

        <FlowerMenu
          viewLayout={viewLayout}
          editNodeIsActive={!isWorldMoveEnabled}
          panNodeIsActive={isWorldMoveEnabled}
          brushAddNodeIsActive={brushMode === BrushMode.ADD}
          brushRemoveNodeIsActive={brushMode === BrushMode.SUBTRACT}
        />
        {/* <ZoomControls /> */}

        <Debug />
      </FlowerMenuStoreProvider>
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
