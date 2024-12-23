import { calculateBBox } from '@helpers/geo';
import { createLog } from '@helpers/log';
import {
  POLYCLIP_RESULT_UNCHANGED,
  applyFeatureDifference,
  applyFeatureIntersection,
  applyFeatureUnion
} from '@helpers/polyclip';
import { BrushFeature, Vector2 } from '@types';
import { translateAbsoluteBrushFeature } from '../brushFeature';
import { FeatureRBush } from '../spatialIndex';
import {
  AddFeatureOptions,
  BrushOperation,
  MoveFeatureOptions
} from '../types';
import { FeatureSlice } from './featureSlice';

const log = createLog('featureHelpers');

export type AddFeatureProps = {
  state: FeatureSlice;
  brushOperation: BrushOperation;
  feature: BrushFeature;
  options: AddFeatureOptions;
};

export type MoveFeatureProps = {
  state: FeatureSlice;
  brushOperation: BrushOperation;
  feature: BrushFeature;
  translation: Vector2;
  options: MoveFeatureOptions;
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

export const moveFeature = ({
  state,
  brushOperation,
  feature,
  translation,
  options
}: MoveFeatureProps) => {
  // log.debug('[moveFeature] moving', feature.id, translation, options);
  const translated = translateAbsoluteBrushFeature(feature, translation);

  // remove existing feature
  state = removeFeatures(state, [feature.id! as string]);

  return addFeature({
    state,
    brushOperation,
    feature: translated,
    options
  });
};

export const addFeature = ({
  state,
  brushOperation,
  feature,
  options
}: AddFeatureProps) => {
  const features = [...state.features];

  if (options.updateBBox) {
    feature.bbox = calculateBBox(feature.geometry);
  }

  const timeMs = performance.now();
  if (brushOperation === BrushOperation.ADD) {
    const [addedCount, removedCount, updatedFeatures] = applyAddition(
      feature,
      state.spatialIndex,
      features
    );

    if (options.selectFeature) {
      state = selectFeature(state, feature.id! as string);
    }

    if (addedCount > 0 || removedCount > 0) {
      return { ...state, features: updatedFeatures };
    }

    state.spatialIndex.insert(feature);
    features.push(feature);

    return { ...state, features };
  } else if (brushOperation === BrushOperation.SUBTRACT) {
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
      'new features in',
      performance.now() - timeMs,
      'ms'
    );

    if (addedCount > 0 || removedCount > 0) {
      return { ...state, features: updatedFeatures };
    }
  } else if (brushOperation === BrushOperation.INTERSECT) {
    const [addedCount, removedCount, updatedFeatures] = applyIntersection(
      feature,
      state.spatialIndex,
      features
    );
    log.debug(
      '[addFeature] applyIntersection added',
      addedCount,
      'removed',
      removedCount,
      'new features in',
      performance.now() - timeMs,
      'ms'
    );

    if (addedCount > 0 || removedCount > 0) {
      return { ...state, features: updatedFeatures };
    }
  }

  state.spatialIndex.insert(feature);
  features.push(feature);

  return { ...state, features };
};

const selectFeature = (state: FeatureSlice, featureId: string) => {
  const selectedFeatures = [...state.selectedFeatures];
  if (selectedFeatures.includes(featureId)) {
    return state;
  }
  selectedFeatures.push(featureId);
  return { ...state, selectedFeatures };
};

const applyAddition = (
  brush: BrushFeature,
  spatialIndex: FeatureRBush,
  features: BrushFeature[]
): [number, number, BrushFeature[]] => {
  const intersectingFeatures = spatialIndex.findByIntersecting(brush);

  const removeFeatures: BrushFeature[] = [];

  const addition = intersectingFeatures.reduce((brush, feature) => {
    const [result, unionFeature] = applyFeatureUnion(feature, brush);

    if (!unionFeature) {
      return brush;
    }

    removeFeatures.push(feature);

    return unionFeature;
  }, brush);

  // remote the existing features
  removeFeatures.forEach((feature) => {
    spatialIndex.remove(feature);
    features = features.filter((f) => f.id !== feature.id);
  });

  if (addition) {
    spatialIndex.insert(addition);
    features.push(addition);
  }

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

const applyIntersection = (
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
    const [result, features] = applyFeatureIntersection(feature, brush);

    if (result !== POLYCLIP_RESULT_UNCHANGED) {
      removeFeatures.push(feature);
    }
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
