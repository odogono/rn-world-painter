import { clamp, runOnJS } from 'react-native-reanimated';

import { createLog } from '@helpers/log';
import { Vector2Create } from '@helpers/vector2';
import { Vector2 } from '@types';

export type CalculateZoomProps = {
  focalPoint: Vector2;
  // worldFocalPoint?: Vector2;
  zoomFactor?: number;
  toScale?: number | undefined;
  scale?: number;
  position?: Vector2;
};

const log = createLog('calculateZoom');

export const calculateZoom = ({
  // worldFocalPoint,
  zoomFactor,
  toScale,
  scale,
  position
}: CalculateZoomProps) => {
  const oldScale = scale!;
  const newScale = toScale ?? clamp(scale! * zoomFactor!, 0.1, 50);

  // Convert focal point to world coordinates before scaling
  const scaleDiff = newScale / oldScale;

  const posX = position!.x * scaleDiff;
  const posY = position!.y * scaleDiff;

  const pos = Vector2Create(posX, posY);
  return { position: pos, scale: newScale };
};
