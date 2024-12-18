import { StateCreator } from 'zustand';

import {
  bboxToLayoutRectangle,
  bboxToString,
  calculateBBox,
  coordinatesToString
} from '@helpers/geo';
import { createLogger } from '@helpers/log';
import { BBox, BrushFeature, Vector2 } from '@types';
import { FeatureRBush, createSpatialIndex } from '../spatialIndex';
import {
  Action,
  ActionType,
  AddBrushAction,
  AddFeatureOptions,
  BrushMode,
  RemoveBrushAction
} from '../types';
import { addFeature, removeFeatures } from './featureHelpers';

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
  getSelectedFeature: () => BrushFeature | undefined;
  getFeatureIdsByPosition: (point: Vector2) => string[];
  clearSelectedFeatures: () => void;

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

  applyAction: (action: Action) => set((state) => applyAction(state, action)),

  undo: () => set((state) => undoAction(state)),

  redo: () => set((state) => redoAction(state)),

  getSelectedFeature: () => {
    const selectedFeatures = get().selectedFeatures;
    if (selectedFeatures.length === 0) {
      return undefined;
    }
    return get().features.find((f) => f.id === selectedFeatures[0]);
  },

  getFeatureIdsByPosition: (point: Vector2) => {
    return (get().spatialIndex.findByPosition(point, true) ?? []).map(
      (f) => f.id
    ) as string[];
  },

  removeSelectedFeatures: () =>
    set((state) =>
      applyAction(state, {
        type: ActionType.REMOVE_BRUSH,
        featureIds: state.selectedFeatures
      })
    ),

  removeFeature: (feature: BrushFeature) =>
    set((state) =>
      applyAction(state, {
        type: ActionType.REMOVE_BRUSH,
        featureIds: [feature.id! as string]
      })
    ),

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

      // log.debug('[handleTap] selectedFeatures', selectedFeatures);

      return { ...state, selectedFeatures };
    }),

  clearSelectedFeatures: () => {
    set((state) => ({ ...state, selectedFeatures: [] }));
  }
});

const replayActions = (state: FeatureSlice) => {
  // clear everything
  const newState = { ...state, features: [], selectedFeatures: [] };
  newState.spatialIndex.clear();

  return state.undoStack.reduce<FeatureSlice>((state, action) => {
    return applyActionInternal(state, action);
  }, newState);
};

const applyAction = (state: FeatureSlice, action: Action) => {
  state = applyActionInternal(state, action);

  // add the action to the undo stack
  state = {
    ...state,
    undoStack: [...state.undoStack, action],
    redoStack: []
  };

  printHistory(state);

  return state;
};

const undoAction = (state: FeatureSlice) => {
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

  printHistory(state);

  return state;
};

const redoAction = (state: FeatureSlice) => {
  // pop the last action from the redo stack
  const action = state.redoStack.pop();

  if (!action) {
    return state;
  }

  // add the action to the undo stack
  state = { ...state, undoStack: [...state.undoStack, action] };

  state = applyActionInternal(state, action);

  printHistory(state);

  return state;
};

const applyActionInternal = (state: FeatureSlice, action: Action) => {
  switch (action.type) {
    case ActionType.ADD_BRUSH:
      return addFeature({
        state,
        brushMode: action.brushMode,
        feature: action.feature,
        options: action.options ?? {}
      });
    case ActionType.REMOVE_BRUSH:
      return removeFeatures(state, action.featureIds);
    default:
      return state;
  }
};

const printHistory = (state: FeatureSlice) => {
  state.undoStack.forEach((action, ii) => {
    log.debug('[undo]', ii, actionToString(action));
  });
  if (state.undoStack.length === 0) {
    log.debug('[undo] empty');
  }
  state.redoStack.forEach((action, ii) => {
    log.debug('[redo]', ii, actionToString(action));
  });
  if (state.redoStack.length === 0) {
    log.debug('[redo] empty');
  }
};

const actionToString = (action: Action) => {
  if (action.type === ActionType.ADD_BRUSH) {
    return addBrushActionToString(action as AddBrushAction);
  } else if (action.type === ActionType.REMOVE_BRUSH) {
    return removeBrushActionToString(action as RemoveBrushAction);
  }
  return '';
};

const addBrushActionToString = (action: AddBrushAction) => {
  return `${action.type} ${action.brushMode} ${action.feature?.id}`;
};

const removeBrushActionToString = (action: RemoveBrushAction) => {
  return `${action.type} ${action.featureIds.join(', ')}`;
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
