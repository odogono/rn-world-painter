import { LayoutRectangle } from 'react-native';

import { bbox as calculateBbox } from '@turf/bbox';
import { BBox, BrushFeature, Position, Vector2 } from '@types';
import { createLogger } from './log';

const log = createLogger('geo');

export const getBBoxCenter = (bbox: BBox): Vector2 => {
  return {
    x: (bbox[0] + bbox[2]) / 2,
    y: (bbox[1] + bbox[3]) / 2
  };
};

export const bboxToLayoutRectangle = (bbox: BBox): LayoutRectangle => {
  return {
    x: bbox[0],
    y: bbox[1],
    width: bbox[2] - bbox[0],
    height: bbox[3] - bbox[1]
  };
};

/**
 * Converts the features geometry from world coordinates to local coordinates
 * the features position property is updated to be the world position
 *
 * @param feature
 * @returns
 */
export const featureGeometryToLocal = (feature: BrushFeature) => {
  // if the feature has already been translated, then nothing to do
  if (feature.properties.isLocal) {
    return feature;
  }

  const worldBBox = calculateBbox(feature.geometry);
  const center = getBBoxCenter(worldBBox);

  log.debug('worldCenter', center);

  const properties = {
    ...feature.properties,
    position: center,
    isLocal: true
  };

  // translate the geometry to the center
  const coordinates = [
    feature.geometry.coordinates[0].map((point) => {
      return [point[0] - center.x, point[1] - center.y] as Position;
    })
  ];

  const geometry = {
    ...feature.geometry,
    coordinates
  };

  const bbox = calculateBbox(geometry);

  return {
    ...feature,
    bbox,
    properties,
    geometry
  };
};
