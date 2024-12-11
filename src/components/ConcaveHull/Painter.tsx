import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Canvas, Path, useCanvasRef } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';

import { createLogger } from '@helpers/log';
import { useViewDims } from '@hooks/useViewDims';
import { Debug } from '../Debug/Debug';
import { ModeButton } from './ModeButton';
import { useGesture } from './useGesture';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

export const Painter = () => {
  const canvasRef = useCanvasRef();
  const { viewDims, setViewDims } = useViewDims();
  const { addPoint, svgPath, endBrush, hullPath } = usePointBrush();
  const pan = useGesture({ onUpdate: addPoint, onEnd: endBrush });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Canvas
          style={styles.canvas}
          ref={canvasRef}
          onLayout={(event) => {
            setViewDims(event.nativeEvent.layout);
          }}
        >
          <Path path={svgPath} color='black' />
          <Path path={hullPath} color='#444' />
        </Canvas>
      </GestureDetector>

      <ModeButton />

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
