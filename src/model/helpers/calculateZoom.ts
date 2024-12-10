import { clamp } from 'react-native-reanimated';

import { Vector2Create } from '@helpers/vector2';
import { Vector2 } from '@types';

export type CalculateZoomProps = {
  focalPoint: Vector2;
  worldFocalPoint?: Vector2;
  zoomFactor?: number;
  toScale?: number | undefined;
  scale?: number;
  position?: Vector2;
};

export const calculateZoom = ({
  worldFocalPoint,
  zoomFactor,
  toScale,
  scale,
  position
}: CalculateZoomProps) => {
  const oldScale = scale!;
  const newScale = toScale ?? clamp(scale! * zoomFactor!, 0.1, 5);

  // Convert focal point to world coordinates before scaling
  const scaleDiff = newScale / oldScale;

  // Calculate the new position to keep the focal point stationary
  let posX = worldFocalPoint!.x - position!.x;
  let posY = worldFocalPoint!.y - position!.y;
  posX = worldFocalPoint!.x - posX;
  posY = worldFocalPoint!.y - posY;
  posX = posX * scaleDiff;
  posY = posY * scaleDiff;
  const pos = Vector2Create(posX, posY);
  return { position: pos, scale: newScale };
};
