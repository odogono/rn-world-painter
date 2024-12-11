import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Canvas,
  Group,
  Path,
  Rect,
  useCanvasRef
} from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction } from 'react-native-reanimated';

import {
  Debug,
  formatVector2,
  setDebugMsg1,
  setDebugMsg2
} from '@components/Debug/Debug';
import { createLogger } from '@helpers/log';
import { useStore, useStoreState, useStoreViewDims } from '@model/useStore';
import { Vector2 } from '@types';
import { ModeButton } from './ModeButton';
import { ZoomControls } from './ZoomControls';
import { useGesture } from './useGesture';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

export const Painter = () => {
  const canvasRef = useCanvasRef();
  const [isWorldMoveEnabled, setIsWorldMoveEnabled] = useState(true);

  const {
    setViewDims,
    width: viewWidth,
    height: viewHeight
  } = useStoreViewDims();

  const { addPoint, svgPath, endBrush, hullPath } = usePointBrush();

  const pan = useGesture({
    isWorldMoveEnabled,
    onUpdate: addPoint,
    onEnd: endBrush
  });

  const [mViewMatrix, mViewPosition, mViewScale] = useStoreState((state) => [
    state.mViewMatrix,
    state.mViewPosition,
    state.mViewScale
  ]);

  useAnimatedReaction(
    () => [mViewPosition.value, mViewScale.value] as [Vector2, number],
    ([position, scale]) => {
      setDebugMsg1(formatVector2(position));
      setDebugMsg2(scale.toString());
    }
  );

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
          <Group matrix={mViewMatrix}>
            <Rect x={-15} y={-15} width={30} height={30} color='red' />
            <Rect x={-15} y={-15 + 60} width={30} height={30} color='black' />
          </Group>
          <Path path={svgPath} color='black' />
          <Path path={hullPath} color='#444' />
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
