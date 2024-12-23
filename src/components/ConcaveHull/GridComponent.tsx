import { Group, Line } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import { useStoreSelector } from '@model/useStore';

interface GridComponentProps {
  gridSize?: number;
  gridColor?: string;
  majorGridSize?: number;
  padding?: number;
}

export const GridComponent = ({
  gridSize = 50,
  gridColor = '#DDDDDD',
  majorGridSize = 200,
  padding = 1000
}: GridComponentProps) => {
  const [mViewBBox, mViewScale] = useStoreSelector((state) => [
    state.mViewBBox,
    state.mViewScale
  ]);

  const gridLines = useDerivedValue(() => {
    const bbox = mViewBBox.value;
    const scale = mViewScale.value;

    // Adjust grid size based on zoom level
    const effectiveGridSize = scale < 0.5 ? majorGridSize : gridSize;

    // Calculate grid boundaries with padding
    const startX =
      Math.floor((bbox[0] - padding) / effectiveGridSize) * effectiveGridSize;
    const endX =
      Math.ceil((bbox[2] + padding) / effectiveGridSize) * effectiveGridSize;
    const startY =
      Math.floor((bbox[1] - padding) / effectiveGridSize) * effectiveGridSize;
    const endY =
      Math.ceil((bbox[3] + padding) / effectiveGridSize) * effectiveGridSize;

    const lines = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += effectiveGridSize) {
      lines.push({
        start: { x, y: startY },
        end: { x, y: endY }
      });
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += effectiveGridSize) {
      lines.push({
        start: { x: startX, y },
        end: { x: endX, y }
      });
    }

    return lines;
  }, [mViewBBox, mViewScale]);

  return (
    <Group>
      {gridLines.value.map((line, index) => (
        <Line
          key={index}
          p1={line.start}
          p2={line.end}
          color={gridColor}
          strokeWidth={1}
        />
      ))}
    </Group>
  );
};
