import { Position as GeoJsonPosition, Polygon } from 'geojson';

import { getBBoxCenter } from '@helpers/geo';
import { generateShortUUID, generateUUID } from '@helpers/uuid';
import { bbox as calculateBbox } from '@turf/bbox';
import { BrushFeature, Position, Vector2 } from '@types';

export type CreateBrushFeatureOptions = {
  id?: string;
  points?: Position[] | GeoJsonPosition[];
  coordinates?: GeoJsonPosition[][];
  isLocal?: boolean;
  properties?: Partial<BrushFeature['properties']>;
};

export const createBrushFeature = ({
  id = generateShortUUID(),
  isLocal = false,
  points,
  coordinates,
  properties = {}
}: CreateBrushFeatureOptions): BrushFeature => {
  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: coordinates ?? [points as unknown as GeoJsonPosition[]]
  };

  const bbox = calculateBbox(geometry);
  const center = getBBoxCenter(bbox);

  // const id = generateShortUUID();

  // calculate the center of the bbox
  // const center: Position = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  return {
    type: 'Feature',
    id,
    bbox,
    properties: {
      position: center,
      isLocal,
      color: '#444',
      ...properties
    },
    geometry
  };
};

// export const centerBrushFeature = (feature: BrushFeature) => {
//   const { bbox, geometry } = feature;
//   const center = getBBoxCenter(bbox!);

//   center.x = -center.x;
//   center.y = -center.y;

//   // translate all the points so that the feature is centered around 0,0
//   const coordinates = geometry.coordinates.map((polygon) => {
//     return polygon.map((point) => {
//       return [point[0] + center.x, point[1] + center.y];
//     });
//   });

//   const newGeometry = { ...geometry, coordinates };
//   const newBbox = calculateBbox(newGeometry);

//   return {
//     ...feature,
//     bbox: newBbox,
//     geometry: newGeometry
//   };
// };

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
