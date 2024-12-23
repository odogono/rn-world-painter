import { Skia } from '@shopify/react-native-skia';
import { Position as GeoJsonPosition, Polygon } from 'geojson';

import { getBBoxCenter } from '@helpers/geo';
import { generateShortUUID } from '@helpers/uuid';
import { bbox as calculateBbox } from '@turf/bbox';
import { BrushFeature, Position, Vector2 } from '@types';
import { createLogger } from '../helpers/log';

export type CreateBrushFeatureOptions = {
  id?: string;
  points?: Position[] | GeoJsonPosition[];
  coordinates?: GeoJsonPosition[][];
  isLocal?: boolean;
  properties?: Partial<BrushFeature['properties']>;
};

const log = createLogger('createBrushFeature');

export const createBrushFeature = ({
  id = generateShortUUID(),
  isLocal = false,
  points,
  coordinates,
  properties: additionalProperties = {}
}: CreateBrushFeatureOptions): BrushFeature => {
  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: coordinates ?? [points as unknown as GeoJsonPosition[]]
  };

  if (!geometry) {
    log.warn('createBrushFeature no geometry', { points, coordinates });
  }

  if (!coordinates && !points) {
    log.warn('createBrushFeature no coordinates or points');
  }

  const bbox = calculateBbox(geometry);
  const center = getBBoxCenter(bbox);

  // const id = generateShortUUID();

  // calculate the center of the bbox
  // const center: Position = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  const properties = {
    position: center,
    isLocal,
    color: '#0061fd',
    ...additionalProperties
  };

  return {
    type: 'Feature',
    id,
    bbox,
    properties,
    geometry
  };
};

export const translateAbsoluteBrushFeature = (
  feature: BrushFeature,
  translation?: Vector2 | undefined
) => {
  const { bbox, geometry } = feature;
  const center = getBBoxCenter(bbox!);

  center.x = -center.x;
  center.y = -center.y;

  if (translation) {
    center.x += translation.x;
    center.y += translation.y;
  }

  // translate all the points so that the feature is centered around 0,0
  const coordinates = geometry.coordinates.map((polygon) => {
    return polygon.map((point) => {
      return [point[0] + center.x, point[1] + center.y];
    });
  });

  const newGeometry = { ...geometry, coordinates };
  const newBbox = calculateBbox(newGeometry);

  return {
    ...feature,
    bbox: newBbox,
    geometry: newGeometry
  };
};

export const copyBrushFeature = (feature: BrushFeature) => {
  return JSON.parse(JSON.stringify(feature));
};

export type SvgPathToBrushFeatureProps = {
  path: string;
  divisions?: number;
  properties?: Partial<BrushFeature['properties']>;
};

/**
 * Converts a svg path to a brush feature
 * @param path
 * @param divisions
 * @returns
 */
export const svgPathToBrushFeature = ({
  path,
  divisions = 48,
  properties
}: SvgPathToBrushFeatureProps): BrushFeature | undefined => {
  const skPath = Skia.Path.MakeFromSVGString(path);
  if (!skPath) return undefined;
  const it = Skia.ContourMeasureIter(skPath, false, 1);
  const contour = it.next();
  const totalLength = contour?.length() ?? 0;

  const polyline: Position[] = [];

  for (let ii = 0; ii < divisions; ii++) {
    const t = ii / divisions;
    const [pos] = contour?.getPosTan(t * totalLength) ?? [{ x: 0, y: 0 }];

    polyline.push([pos.x, pos.y] as Position);
  }

  const feature = createBrushFeature({
    ...properties,
    points: polyline
  });

  return feature;
};
