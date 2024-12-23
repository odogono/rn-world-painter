import * as polyclip from 'polyclip-ts';
import { Geom } from 'polyclip-ts';

import { createLog } from '@helpers/log';
import { BrushFeature } from '@types';
import { createBrushFeature } from '../model/brushFeature';

const log = createLog('polyclip');

export const POLYCLIP_RESULT_REMOVED = -1;
export const POLYCLIP_RESULT_UNCHANGED = 0;

export const applyFeatureUnion = (
  featureA: BrushFeature,
  featureB: BrushFeature
): [number, BrushFeature | null] => {
  const poly1: Geom = featureA.geometry.coordinates as Geom;
  const poly2: Geom = featureB.geometry.coordinates as Geom;

  const diff = polyclip.union(poly1, poly2);

  if (diff.length === 0) {
    return [0, null];
  }

  if (diff.length > 1) {
    if (diff.length !== 2) {
      log.warn('[applyFeatureUnion] result', diff.length);
    }
    return [0, null];
  }

  const feature = createBrushFeature({
    coordinates: diff[0],
    id: featureB.id! as string,
    properties: { ...featureA.properties }
  });

  return [1, feature];
};

export const applyFeatureDifference = (
  featureA: BrushFeature,
  featureB: BrushFeature
): [number, BrushFeature[]] => {
  const poly1: Geom = featureA.geometry.coordinates as Geom;
  const poly2: Geom = featureB.geometry.coordinates as Geom;

  const diff = polyclip.difference(poly1, poly2);

  if (diff.length === 0) {
    return [-1, []];
  }

  // // determine whether the result is the same as the first argument
  if (JSON.stringify(diff[0]) === JSON.stringify(poly1)) {
    return [0, []];
  }

  const result: BrushFeature[] = [];

  diff.forEach((poly) => {
    const feature = createBrushFeature({
      coordinates: poly,
      properties: featureA.properties
    });
    result.push(feature);
  });

  return [result.length, result];
};

export const applyFeatureIntersection = (
  featureA: BrushFeature,
  featureB: BrushFeature
): [number, BrushFeature[]] => {
  const poly1: Geom = featureA.geometry.coordinates as Geom;
  const poly2: Geom = featureB.geometry.coordinates as Geom;

  const diff = polyclip.intersection(poly1, poly2);

  const result: BrushFeature[] = [];

  diff.forEach((poly) => {
    const feature = createBrushFeature({
      coordinates: poly,
      properties: featureA.properties
    });
    result.push(feature);
  });

  return [result.length, result];
};
