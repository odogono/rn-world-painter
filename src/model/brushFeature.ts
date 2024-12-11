import { Position as GeoJsonPosition, Polygon } from 'geojson';

import { bbox as calculateBbox } from '@turf/bbox';
import { BrushFeature, Position } from '@types';

export type CreateBrushFeatureOptions = {
  points: Position[];
  isLocal?: boolean;
};

export const createBrushFeature = ({
  isLocal = false,
  points
}: CreateBrushFeatureOptions): BrushFeature => {
  const geometry: Polygon = {
    type: 'Polygon',
    coordinates: [points as unknown as GeoJsonPosition[]]
  };

  const bbox = calculateBbox(geometry);

  // calculate the center of the bbox
  // const center: Position = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  return {
    type: 'Feature',
    bbox,
    properties: {
      position: [0, 0],
      isLocal,
      color: '#444'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [points as unknown as GeoJsonPosition[]]
    }
  };
};
