import { LayoutRectangle } from 'react-native';

import Concaveman from 'concaveman';
import { Position as GeoJSONPosition } from 'geojson';

import { simplify as simplifyPoints } from '@helpers/simplify';
import { bbox as calculateBbox } from '@turf/bbox';
import { BBox, BrushFeature, Position, Vector2 } from '@types';
import { createLog } from './log';
import { generateUUID } from './uuid';

export { bbox as calculateBBox } from '@turf/bbox';

const log = createLog('geo');

type AdditionalProperties = Partial<BrushFeature['properties']> & {
  id?: string;
};

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

const formatFixed = (value: number, precision: number = 2) => {
  if (value < 0) {
    return value.toFixed(precision);
  } else {
    return `+${value.toFixed(precision)}`;
  }
};

export const bboxToString = (bbox: BBox, precision: number = 2) => {
  const [minX, minY, maxX, maxY] = bbox;
  const x = minX;
  const y = minY;
  const w = maxX - minX;
  const h = maxY - minY;
  return `x: ${formatFixed(x, precision)}, y: ${formatFixed(y, precision)}, w: ${formatFixed(w, precision)}, h: ${formatFixed(h, precision)}`;
};

export const coordinatesToString = (
  coordinates: Position[] | GeoJSONPosition[]
) => {
  return coordinates
    .map((point) => {
      return `[${formatFixed(point[0], 2)}, ${formatFixed(point[1], 2)}]`;
    })
    .join(', ');
};

/**
 * Translates the feature by the offset, updating the bbox and geometry
 *
 * @param feature
 * @param offset
 * @returns
 */
export const translateBrushFeature = (
  feature: BrushFeature,
  offset: Vector2,
  additionalProperties: AdditionalProperties = {}
) => {
  const coordinates = [
    feature.geometry.coordinates[0].map((point) => {
      return [point[0] + offset.x, point[1] + offset.y] as Position;
    })
  ];

  const { id, ...rest } = additionalProperties;

  const geometry = {
    ...feature.geometry,
    coordinates
  };

  const bbox = calculateBbox(geometry);
  const center = getBBoxCenter(bbox);

  const properties = {
    ...feature.properties,
    position: center,
    ...rest
  };

  return {
    ...feature,
    id: id ?? generateUUID(),
    bbox,
    properties,
    geometry
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

export type GenerateConcaveHullProps = {
  points: Position[];
  concavity?: number;
  minArea?: number;
  simplify?: boolean;
  simplifyTolerance?: number;
  simplifyHighQuality?: boolean;
};

/**
 * Generates a concave hull from the points
 *
 * @param points
 * @returns
 */
export const generateConcaveHull = ({
  points,
  concavity = 3,
  minArea = 20,
  simplify = false,
  simplifyTolerance = 6,
  simplifyHighQuality = true
}: GenerateConcaveHullProps) => {
  const outcome = Concaveman(points, concavity, minArea) as Position[];
  return simplify
    ? simplifyPoints(outcome, simplifyTolerance, simplifyHighQuality)
    : outcome;
};
