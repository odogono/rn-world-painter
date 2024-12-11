import { createContext } from 'react';
import type { LayoutRectangle } from 'react-native';

import type { BBox, Mutable, Vector2 } from '@types';
import { Store } from '../Store';

export type ZoomOnPointProps = {
  focalPoint?: Vector2;
  zoomFactor?: number;
  toScale?: number;
  duration?: number;
};

export type StoreContextType = {
  store: Store;
  mViewPosition: Mutable<Vector2>;
  mViewScale: Mutable<number>;
  mViewBBox: Mutable<BBox>;

  viewLayout: LayoutRectangle;

  screenToWorld: (point: Vector2) => Vector2;

  zoomOnPoint: (props: ZoomOnPointProps) => void;
  worldToScreen: (point: Vector2) => Vector2;
};

export const StoreContext = createContext<StoreContextType | null>(null);
