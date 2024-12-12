import * as polyclip from 'polyclip-ts';
import { Geom } from 'polyclip-ts';

import { BrushFeature } from '@types';
import { createBrushFeature } from '../model/brushFeature';

export const applyFeatureDifference = (
  featureB: BrushFeature,
  featureA: BrushFeature
) => {
  const poly1: Geom = featureA.geometry.coordinates as Geom;
  const poly2: Geom = featureB.geometry.coordinates as Geom;

  const diff = polyclip.difference(poly1, poly2);

  const result: BrushFeature[] = [];

  diff.forEach((poly) => {
    const feature = createBrushFeature({ coordinates: poly });
    result.push(feature);
  });

  return result;
};
