import { Position as GeoJsonPosition, Polygon } from 'geojson';

import { getBBoxCenter } from '@helpers/geo';
import { generateShortUUID, generateUUID } from '@helpers/uuid';
import { bbox as calculateBbox } from '@turf/bbox';
import { BrushFeature, Position } from '@types';

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
