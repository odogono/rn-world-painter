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
import {
  useStore,
  useStoreSetViewLayout,
  useStoreState
} from '@model/useStore';
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature, Vector2 } from '@types';
import { FlowerMenuStoreProvider } from '../FlowerMenu/storeContext';
import { MiniMap } from './MiniMap';
import { ModeButton } from './ModeButton';
import { ShapeRenderer } from './ShapeRenderer';
import { ZoomControls } from './ZoomControls';
import { useGesture } from './useGesture';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

export const Painter = () => {
  const ContextBridge = useContextBridge();
  const canvasRef = useCanvasRef();
  const [isWorldMoveEnabled, setIsWorldMoveEnabled] = useState(true);

  const { addFeature, resetFeatures } = useStoreActions();

  const onFlowerMenuEvent = useCallback((event: any, ...args: any[]) => {
    log.debug('[FlowerMenu][event]', event, ...args);
  }, []);

  // const events = useEvents();

  // useEffect(() => {
  //   const handler = (event: any) => {
  //     log.debug('event', event);
  //   };
  //   events?.on('*', handler);
  //   return () => {
  //     events?.off('*', handler);
  //   };
  // }, [events]);

  useEffect(() => {
    addFeature(testFeature as BrushFeature);
    addFeature(testFeature2 as BrushFeature);

    return () => {
      resetFeatures();
    };
  }, []);

  const setViewLayout = useStoreSetViewLayout();

  const { addPoint, svgPath, endBrush } = usePointBrush();

  const pan = useGesture({
    isWorldMoveEnabled,
    onUpdate: addPoint,
    onEnd: endBrush
  });

  const [mViewMatrix, mViewPosition, mViewScale, mViewBBox] = useStoreState(
    (state) => [
      state.mViewMatrix,
      state.mViewPosition,
      state.mViewScale,
      state.mViewBBox
    ]
  );

  useAnimatedReaction(
    () =>
      [mViewPosition.value, mViewScale.value, mViewBBox.value] as [
        Vector2,
        number,
        BBox
      ],
    ([position, scale, bbox]) => {
      setDebugMsg1(formatVector2(position));
      setDebugMsg2(scale.toString());
      setDebugMsg3(formatBBox(bbox));
    }
  );

  return (
    <View style={styles.container}>
      <FlowerMenuStoreProvider
        insets={{ left: 10, top: 50, right: 10, bottom: 50 }}
        onEvent={onFlowerMenuEvent}
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

              <Path path={svgPath} color='black' />
            </ContextBridge>
          </Canvas>
        </GestureDetector>

        <FlowerMenu
          isWorldMoveEnabled={isWorldMoveEnabled}
          onPress={() => setIsWorldMoveEnabled(!isWorldMoveEnabled)}
        />
        <ZoomControls />

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
