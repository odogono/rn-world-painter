import { calculateBBox } from '@helpers/geo';
import { createLogger } from '@helpers/log';
import {
  POLYCLIP_RESULT_UNCHANGED,
  applyFeatureDifference,
  applyFeatureUnion
} from '@helpers/polyclip';
import { BrushFeature } from '@types';
import { FeatureRBush } from '../spatialIndex';
import { AddFeatureOptions, BrushMode } from '../types';
import { FeatureSlice } from './featureSlice';

const log = createLogger('featureHelpers');

export type AddFeatureProps = {
  state: FeatureSlice;
  brushMode: BrushMode;
  feature: BrushFeature;
  options: AddFeatureOptions;
};

export const removeFeatures = (state: FeatureSlice, featureIds: string[]) => {
  const featuresToRemove = state.features.filter((f) =>
    featureIds.includes(f.id! as string)
  );

  const featuresRemaining = state.features.filter(
    (f) => !featureIds.includes(f.id! as string)
  );

  const selectedFeatures = state.selectedFeatures.filter(
    (id) => !featureIds.includes(id)
  );

  featuresToRemove.forEach((f) => state.spatialIndex.remove(f));

  return { ...state, features: featuresRemaining, selectedFeatures };
};

export const addFeature = ({
  state,
  brushMode,
  feature,
  options
}: AddFeatureProps) => {
  const features = [...state.features];

  if (options.updateBBox) {
    feature.bbox = calculateBBox(feature.geometry);
  }

  if (brushMode === BrushMode.ADD) {
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
  } else if (brushMode === BrushMode.SUBTRACT) {
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
  // const newFeatures: BrushFeature[] = [];

  const addition = intersectingFeatures.reduce((brush, feature) => {
    const [result, unionFeature] = applyFeatureUnion(feature, brush);

    if (!unionFeature) {
      return brush;
    }

    removeFeatures.push(feature);

    return unionFeature;
  }, brush);

  // intersectingFeatures.forEach((feature) => {
  //   const [result, unionFeature] = applyFeatureUnion(feature, brush);
  //   removeFeatures.push(feature);
  //   log.debug('[applyAddition] remove', feature.id);
  //   newFeatures.push(...features);
  //   log.debug(
  //     '[applyAddition] add',
  //     features.map((f) => f.id)
  //   );
  // });

  // remote the existing features
  removeFeatures.forEach((feature) => {
    spatialIndex.remove(feature);
    features = features.filter((f) => f.id !== feature.id);
  });

  if (addition) {
    spatialIndex.insert(addition);
    features.push(addition);
  }

  // add the new features
  // newFeatures.forEach((feature) => {
  //   spatialIndex.insert(feature);
  //   features.push(feature);
  // });

  return [addition ? 1 : 0, removeFeatures.length, features];
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
