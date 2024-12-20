import { PathProps, SkiaDefaultProps } from '@shopify/react-native-skia';
import type { Feature, Polygon } from 'geojson';
import { makeMutable } from 'react-native-reanimated';

export type { LayoutRectangle as Rect2 } from 'react-native';

export type Mutable<T> = ReturnType<typeof makeMutable<T>>;

export type Vector2 = {
  x: number;
  y: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type { BBox } from 'geojson';

export type Position = [number, number];

export interface BrushFeatureProperties {
  position: Vector2;
  odgnId?: string;
  color: string;
  isLocal?: boolean;
  isSelected?: boolean;
}

export type BrushFeature = Feature<Polygon, BrushFeatureProperties>;

export type LayoutInsets = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type SkiaPathProps = SkiaDefaultProps<PathProps, 'start' | 'end'>;
