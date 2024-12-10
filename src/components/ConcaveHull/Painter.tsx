import { StyleSheet } from 'react-native';

import { Canvas, Path, useCanvasRef } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';

import { createLogger } from '@helpers/log';
import { useViewDims } from '@hooks/useViewDims';
import { useGesture } from './useGesture';
import { usePointBrush } from './usePointBrush';

const log = createLogger('Painter');

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

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%',
    backgroundColor: 'cyan'
  }
});
