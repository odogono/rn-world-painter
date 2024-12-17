import { calculateBBox } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import {
  POLYCLIP_RESULT_UNCHANGED,
  applyFeatureDifference,
  applyFeatureUnion
} from '@helpers/polyclip';
import { BrushFeature } from '@types';
import { FeatureRBush } from '../spatialIndex';
import { AddFeatureOptions, ApplyOperation } from '../types';
import { FeatureSlice } from './featureSlice';

const log = createLogger('featureHelpers');

export const addFeature = (
  state: FeatureSlice,
  feature: BrushFeature,
  options: AddFeatureOptions = {}
) => {
  const features = [...state.features];

  if (options.updateBBox) {
    feature.bbox = calculateBBox(feature.geometry);
  }

  if (options.applyOperation === ApplyOperation.ADD) {
    const [addedCount, removedCount, updatedFeatures] = applyAddition(
      feature,
      state.spatialIndex,
      features
    );

    log.debug('[addFeature] applyAddition added', addedCount);
    log.debug('[addFeature] applyAddition removed', removedCount);

    if (addedCount > 0 || removedCount > 0) {
      return { ...state, features: updatedFeatures };
    }

    state.spatialIndex.insert(feature);
    features.push(feature);

    return { ...state, features };
  } else if (options.applyOperation === ApplyOperation.SUBTRACT) {
    const timeMs = performance.now();

    const [addedCount, removedCount, updatedFeatures] = applySubtraction(
      feature,
      state.spatialIndex,
      features
    );

    log.debug(
      '[addFeature] applySubtraction added',
      addedCount,
      'removed',
      removedCount,
      'new features',
      performance.now() - timeMs
    );

    if (addedCount > 0 || removedCount > 0) {
      return { ...state, features: updatedFeatures };
    }
  }

  state.spatialIndex.insert(feature);
  features.push(feature);

  return { ...state, features };
};

const applyAddition = (
  brush: BrushFeature,
  spatialIndex: FeatureRBush,
  features: BrushFeature[]
): [number, number, BrushFeature[]] => {
  const intersectingFeatures = spatialIndex.findByIntersecting(brush);

  const removeFeatures: BrushFeature[] = [];
  const newFeatures: BrushFeature[] = [];

  intersectingFeatures.forEach((feature) => {
    const [result, features] = applyFeatureUnion(feature, brush);
    log.debug('🔥 [applyAddition] applyFeatureUnion', result);
    // if (result !== POLYCLIP_RESULT_UNCHANGED) {
    removeFeatures.push(feature);
    // }
    newFeatures.push(...features);
  });

  // remote the existing features
  removeFeatures.forEach((feature) => {
    spatialIndex.remove(feature);
    features = features.filter((f) => f.id !== feature.id);
  });

  // add the new features
  newFeatures.forEach((feature) => {
    spatialIndex.insert(feature);
    features.push(feature);
  });

  return [newFeatures.length, removeFeatures.length, features];
};

const applySubtraction = (
  brush: BrushFeature,
  spatialIndex: FeatureRBush,
  features: BrushFeature[]
): [number, number, BrushFeature[]] => {
  const intersectingFeatures = spatialIndex.findByIntersecting(brush);

  if (!intersectingFeatures.length) {
    return [0, 0, features];
  }

  const removeFeatures: BrushFeature[] = [];
  const newFeatures: BrushFeature[] = [];

  intersectingFeatures.forEach((feature) => {
    const [result, features] = applyFeatureDifference(feature, brush);
    log.debug('[applySubtraction] applyFeatureDifference', result);
    if (result !== POLYCLIP_RESULT_UNCHANGED) {
      removeFeatures.push(feature);
    }
    newFeatures.push(...features);
  });

  log.debug('[applySubtraction] removeFeatures', removeFeatures.length);
  log.debug('[applySubtraction] newFeatures', newFeatures.length);

  if (newFeatures.length === 0 && removeFeatures.length === 0) {
    return [0, 0, features];
  }

  // remote the existing features
  removeFeatures.forEach((feature) => {
    spatialIndex.remove(feature);
    features = features.filter((f) => f.id !== feature.id);
  });

  // add the new features
  newFeatures.forEach((feature) => {
    spatialIndex.insert(feature);
    features.push(feature);
  });

  return [newFeatures.length, removeFeatures.length, features];
};
