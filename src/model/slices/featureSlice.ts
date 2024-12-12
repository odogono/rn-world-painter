import { StateCreator } from 'zustand';

import {
  bboxToLayoutRectangle,
  bboxToString,
  calculateBBox,
  coordinatesToString
} from '@helpers/geo';
import { createLogger } from '@helpers/log';
import {
  POLYCLIP_RESULT_UNCHANGED,
  applyFeatureDifference,
  applyFeatureIntersection
} from '@helpers/polyclip';
import { BBox, BrushFeature } from '@types';
import { FeatureRBush, createSpatialIndex } from '../spatialIndex';

export type FeatureSliceProps = {
  features: BrushFeature[];

  spatialIndex: FeatureRBush;
};

export type AddFeatureOptions = {
  updateBBox?: boolean;
  applySubtraction?: boolean;
};

export type FeatureSliceActions = {
  addFeature: (feature: BrushFeature, options?: AddFeatureOptions) => void;
  removeFeature: (feature: BrushFeature) => void;
  resetFeatures: () => void;
  getVisibleFeatures: (bbox: BBox) => BrushFeature[];
};

export type FeatureSlice = FeatureSliceProps & FeatureSliceActions;

const defaultState: FeatureSliceProps = {
  features: [],
  spatialIndex: createSpatialIndex()
};

const log = createLogger('featureSlice');

export const createFeatureSlice: StateCreator<
  FeatureSlice,
  [],
  [],
  FeatureSlice
> = (set, get) => ({
  ...defaultState,

  addFeature: (feature: BrushFeature, options: AddFeatureOptions = {}) => {
    set((state) => {
      const features = [...state.features];

      if (options.updateBBox) {
        feature.bbox = calculateBBox(feature.geometry);
      }

      if (options.applySubtraction) {
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
    });
  },

  removeFeature: (feature: BrushFeature) => {
    set((state) => {
      state.spatialIndex.remove(feature);
      return {
        ...state,
        features: state.features.filter((f) => f.id !== feature.id)
      };
    });
  },

  resetFeatures: () => {
    get().spatialIndex.clear();
    set(defaultState);
  },

  getVisibleFeatures: (bbox: BBox) => {
    if (get().features.length === 0) {
      return [];
    }

    return get().spatialIndex.findByBBox(bbox);
  }
});

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

// const applySubtractionToFeatures = (
//   srcFeature: BrushFeature,
//   dstFeatures: BrushFeature[]
// ) => {
//   const result: BrushFeature[] = [];

//   dstFeatures.forEach((dstFeature) => {
//     const features = applyFeatureDifference(dstFeature, srcFeature);
//     result.push(...features);
//   });

//   return result;
// };
