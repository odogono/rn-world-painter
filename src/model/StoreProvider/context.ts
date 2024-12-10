import { createContext } from 'react';

import type { BBox, Mutable, Vector2 } from '@types';
import { Store } from '../Store';

export type StoreContextType = {
  store: Store;
  mViewPosition: Mutable<Vector2>;
  mViewScale: Mutable<number>;
  mViewBBox: Mutable<BBox>;

  screenToWorld: (point: Vector2) => Vector2;

  zoomOnPoint: (
    focalPoint: Vector2,
    zoomFactor: number,
    duration?: number
  ) => void;
  worldToScreen: (point: Vector2) => Vector2;
};

export const StoreContext = createContext<StoreContextType | null>(null);
