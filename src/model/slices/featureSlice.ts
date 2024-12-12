import { StateCreator } from 'zustand';

import {
  bboxToLayoutRectangle,
  bboxToString,
  calculateBBox,
  coordinatesToString
} from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { BBox, BrushFeature } from '@types';
import { FeatureRBush, createSpatialIndex } from '../spatialIndex';

export type FeatureSliceProps = {
  features: BrushFeature[];

  spatialIndex: FeatureRBush;
};

export type AddFeatureOptions = {
  updateBBox?: boolean;
};

export type FeatureSliceActions = {
  addFeature: (feature: BrushFeature, options?: AddFeatureOptions) => void;
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
      if (options.updateBBox) {
        feature.bbox = calculateBBox(feature.geometry);
      }

      state.spatialIndex.insert(feature);

      // log.debug(
      //   '[addFeature] feature',
      //   feature.id,
      //   bboxToString(feature.bbox!)
      // );
      // log.debug(
      //   '[addFeature] feature',
      //   feature.id,
      //   coordinatesToString(feature.geometry.coordinates[0])
      // );

      return { ...state, features: [...state.features, feature] };
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
