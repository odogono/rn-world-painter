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

export interface WPFeatureProperties {
  odgnId?: string;
  color: string;
}

export type WPFeature = Feature<Polygon, WPFeatureProperties>;
