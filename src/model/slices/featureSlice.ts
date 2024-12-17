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
  applyFeatureIntersection,
  applyFeatureUnion
} from '@helpers/polyclip';
import { BBox, BrushFeature, Vector2 } from '@types';
import { FeatureRBush, createSpatialIndex } from '../spatialIndex';
import {
  Action,
  ActionType,
  AddFeatureOptions,
  ApplyOperation
} from '../types';
import { addFeature } from './featureHelpers';

export type FeatureSliceProps = {
  features: BrushFeature[];
  spatialIndex: FeatureRBush;
  selectedFeatures: string[];
  undoStack: Action[];
  redoStack: Action[];
};

const defaultState: FeatureSliceProps = {
  features: [],
  spatialIndex: createSpatialIndex(),
  selectedFeatures: [],
  undoStack: [],
  redoStack: []
};

export type FeatureSliceActions = {
  applyAction: (action: Action) => void;
  // addFeature: (feature: BrushFeature, options?: AddFeatureOptions) => void;
  removeFeature: (feature: BrushFeature) => void;
  resetFeatures: () => void;
  getVisibleFeatures: (bbox: BBox) => BrushFeature[];
  removeSelectedFeatures: () => void;
  handleTap: (point: Vector2) => void;

  undo: () => void;
  redo: () => void;
};

export type FeatureSlice = FeatureSliceProps & FeatureSliceActions;

const log = createLogger('featureSlice');

export const createFeatureSlice: StateCreator<
  FeatureSlice,
  [],
  [],
  FeatureSlice
> = (set, get) => ({
  ...defaultState,

  // addFeature: (feature: BrushFeature, options: AddFeatureOptions = {}) => {
  //   set((state) => {
  //     const features = [...state.features];

  //     if (options.updateBBox) {
  //       feature.bbox = calculateBBox(feature.geometry);
  //     }

  //     if (options.applyOperation === ApplyOperation.ADD) {
  //       const [addedCount, removedCount, updatedFeatures] = applyAddition(
  //         feature,
  //         state.spatialIndex,
  //         features
  //       );

  //       log.debug('[addFeature] applyAddition added', addedCount);
  //       log.debug('[addFeature] applyAddition removed', removedCount);

  //       if (addedCount > 0 || removedCount > 0) {
  //         return { ...state, features: updatedFeatures };
  //       }

  //       state.spatialIndex.insert(feature);
  //       features.push(feature);

  //       return { ...state, features };
  //     } else if (options.applyOperation === ApplyOperation.SUBTRACT) {
  //       const timeMs = performance.now();

  //       const [addedCount, removedCount, updatedFeatures] = applySubtraction(
  //         feature,
  //         state.spatialIndex,
  //         features
  //       );

  //       log.debug(
  //         '[addFeature] applySubtraction added',
  //         addedCount,
  //         'removed',
  //         removedCount,
  //         'new features',
  //         performance.now() - timeMs
  //       );

  //       if (addedCount > 0 || removedCount > 0) {
  //         return { ...state, features: updatedFeatures };
  //       }
  //     }

  //     state.spatialIndex.insert(feature);
  //     features.push(feature);

  //     return { ...state, features };
  //   });
  // },

  removeSelectedFeatures: () => {
    set((state) => {
      const selectedFeatures = state.selectedFeatures;

      const featuresToRemove = state.features.filter((f) =>
        selectedFeatures.find((id) => id === f.id)
      );
      const featuresRemaining = state.features.filter(
        (f) => !selectedFeatures.find((id) => id === f.id)
      );

      featuresToRemove.forEach((f) => state.spatialIndex.remove(f));
      return { ...state, features: featuresRemaining, selectedFeatures: [] };
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
  },

  handleTap: (point: Vector2) =>
    set((state) => {
      const selectedFeatures: string[] = [];
      // bounding box search with point in position
      const featureIds = get()
        .spatialIndex.findByPosition(point, true)
        .map((f) => f.id!) as string[];

      // if (featureIds.length === 0) {
      //   return { ...state, selectedFeatures: [] };
      // }

      // let selectedFeatures = [...state.selectedFeatures];

      featureIds.forEach((featureId) => {
        // if (selectedFeatures.includes(featureId)) {
        //   selectedFeatures = selectedFeatures.filter((f) => f !== featureId);
        // } else {
        selectedFeatures.push(featureId);
        // }
      });

      log.debug('[handleTap] selectedFeatures', selectedFeatures);

      return { ...state, selectedFeatures };
    }),

  applyAction: (action: Action) =>
    set((state) => {
      state = applyAction(state, action);

      // add the action to the undo stack
      state = {
        ...state,
        undoStack: [...state.undoStack, action],
        redoStack: []
      };

      return state;
    }),

  // replayActions: () =>
  //   set((state) => {
  //     // clear everything
  //     const newState = { ...state, features: [], selectedFeatures: [] };
  //     newState.spatialIndex.clear();

  //     state.undoStack.reduce<FeatureSlice>((state, action) => {
  //       return applyAction(state, action);
  //     }, newState);

  //     return newState;
  //   }),

  undo: () =>
    set((state) => {
      // pop the last action from the undo stack
      const action = state.undoStack.pop();

      if (!action) {
        return state;
      }

      // add the action to the redo stack
      state = { ...state, redoStack: [...state.redoStack, action] };

      state = replayActions(state);

      log.debug(
        '[undo] undo stack',
        state.undoStack.length,
        'redo stack',
        state.redoStack.length
      );

      return state;
    }),
  redo: () =>
    set((state) => {
      // pop the last action from the redo stack
      const action = state.redoStack.pop();

      if (!action) {
        return state;
      }

      // add the action to the undo stack
      state = { ...state, undoStack: [...state.undoStack, action] };

      state = applyAction(state, action);

      log.debug(
        '[redo] undo stack',
        state.undoStack.length,
        'redo stack',
        state.redoStack.length
      );

      return state;
    })
});

const replayActions = (state: FeatureSlice) => {
  // clear everything
  const newState = { ...state, features: [], selectedFeatures: [] };
  newState.spatialIndex.clear();

  return state.undoStack.reduce<FeatureSlice>((state, action) => {
    return applyAction(state, action);
  }, newState);
};

const applyAction = (state: FeatureSlice, action: Action) => {
  switch (action.type) {
    case ActionType.ADD_BRUSH:
      return addFeature(state, action.feature!, action.options);
    default:
      return state;
  }
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
