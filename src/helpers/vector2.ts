import { Vector2 } from '@types';

export const Vector2Create = (x: number = 0, y: number = 0): Vector2 => ({
  x,
  y
});

export const Vector2MultiplyScalar = (
  out: Vector2,
  v: Vector2,
  s: number
): Vector2 => {
  out.x = v.x * s;
  out.y = v.y * s;
  return out;
};
