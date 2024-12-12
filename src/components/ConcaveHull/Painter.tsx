import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Canvas,
  Group,
  Path,
  Rect,
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
import { createLogger } from '@helpers/log';
import { useStore, useStoreState, useStoreViewDims } from '@model/useStore';
import { BBox, Vector2 } from '@types';
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

  const {
    setViewDims,
    width: viewWidth,
    height: viewHeight
  } = useStoreViewDims();

  const { addPoint, svgPath, endBrush, hullPath, shapeFeature } =
    usePointBrush();

  const pan = useGesture({
    isWorldMoveEnabled,
    onUpdate: addPoint,
    onEnd: endBrush
  });

  const [mViewMatrix, mViewPosition, mViewScale, mViewBBox, features] =
    useStoreState((state) => [
      state.mViewMatrix,
      state.mViewPosition,
      state.mViewScale,
      state.mViewBBox,
      state.features
    ]);

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

  const shapeMatrix = useDerivedValue(() => {
    const m = Skia.Matrix();
    // if (shapeFeature.value) {
    //   m.translate(
    //     shapeFeature.value.properties.position.x,
    //     shapeFeature.value.properties.position.y
    //   );
    // }
    return m;
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Canvas
          style={styles.canvas}
          ref={canvasRef}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setViewDims(width, height);
          }}
        >
          <ContextBridge>
            <Group matrix={mViewMatrix}>
              <Rect x={-15} y={-15} width={30} height={30} color='red' />
              <Rect x={-15} y={-15 + 60} width={30} height={30} color='black' />

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

      <ModeButton
        isWorldMoveEnabled={isWorldMoveEnabled}
        onPress={() => setIsWorldMoveEnabled(!isWorldMoveEnabled)}
      />
      <ZoomControls />

      <Debug />
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
