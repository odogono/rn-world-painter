import { bbox as calculateBbox } from '@turf/bbox';
import { BBox, BrushFeature, Position } from '@types';

export const getBBoxCenter = (bbox: BBox): Position => {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
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

  const bbox = calculateBbox(feature.geometry);
  const center = getBBoxCenter(bbox);

  const properties = {
    ...feature.properties,
    position: center,
    isLocal: true
  };

  // translate the geometry to the center
  const coordinates = [
    feature.geometry.coordinates[0].map((point) => {
      return [point[0] - center[0], point[1] - center[1]] as Position;
    })
  ];

  return {
    ...feature,
    bbox,
    properties,
    geometry: {
      ...feature.geometry,
      coordinates
    }
  };
};
