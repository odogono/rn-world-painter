import { StateCreator } from 'zustand';

import {
  bboxToLayoutRectangle,
  bboxToString,
  calculateBBox,
  coordinatesToString
} from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { BBox, BrushFeature } from '@types';
import { applyFeatureDifference } from '../../helpers/polyclip';
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
      let features = [...state.features];

      if (options.updateBBox) {
        feature.bbox = calculateBBox(feature.geometry);
      }

      if (options.applySubtraction) {
        const intersectingFeatures =
          state.spatialIndex.findByIntersecting(feature);

        if (intersectingFeatures.length) {
          log.debug(
            '[addFeature] applySubtraction intersecting:',
            intersectingFeatures.length
          );

          const newFeatures = applySubtractionToFeatures(
            feature,
            intersectingFeatures
          );

          log.debug(
            '[addFeature] applySubtraction',
            newFeatures.length,
            'new features'
          );

          // remote the existing features
          intersectingFeatures.forEach((feature) => {
            state.spatialIndex.remove(feature);
            features = features.filter((f) => f.id !== feature.id);
          });

          newFeatures.forEach((feature) => {
            state.spatialIndex.insert(feature);
            features.push(feature);
          });

          return { ...state, features };
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

    // log.debug('[getVisibleFeatures] bbox', bbox);

    // get().features.forEach((feature) => {
    //   log.debug('[getVisibleFeatures] feature', feature.id, feature.bbox);
    // });

    const result = get().spatialIndex.findByBBox(bbox);

    // log.debug('[getVisibleFeatures] result', result);

    return result;
  }
});

const applySubtractionToFeatures = (
  srcFeature: BrushFeature,
  dstFeatures: BrushFeature[]
) => {
  const result: BrushFeature[] = [];

  dstFeatures.forEach((dstFeature) => {
    const features = applyFeatureDifference(srcFeature, dstFeature);
    result.push(...features);
  });

  return result;
};
