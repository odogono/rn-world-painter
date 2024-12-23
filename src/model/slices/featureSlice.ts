import { StateCreator } from 'zustand';

import { createLogger } from '@helpers/log';
import { BBox, BrushFeature, Vector2 } from '@types';
import { FeatureRBush, createSpatialIndex } from '../spatialIndex';
import {
  Action,
  ActionType,
  BrushOperation,
  PaintMode,
  ShapeTemplate
} from '../types';
import {
  applyAction,
  applyActionInternal,
  redoAction,
  undoAction
} from './actions';

export type FeatureSliceProps = {
  features: BrushFeature[];
  spatialIndex: FeatureRBush;
  selectedFeatures: string[];
  undoStack: Action[];
  redoStack: Action[];
  brushOperation: BrushOperation;
  brushColor: string;
  brushSize: number;
  brushShape: ShapeTemplate;
  brushMode: PaintMode;
  isPanViewEnabled: boolean;
};

const defaultState: FeatureSliceProps = {
  features: [],
  spatialIndex: createSpatialIndex(),
  selectedFeatures: [],
  undoStack: [],
  redoStack: [],
  brushOperation: BrushOperation.ADD,
  brushColor: '#0061fd',
  brushSize: 10,
  brushShape: 'circle',
  brushMode: PaintMode.PAINT,
  isPanViewEnabled: true
};

export type FeatureSliceActions = {
  setBrushOperation: (brushOperation: BrushOperation) => void;
  getBrushOperation: () => BrushOperation;
  setBrushColor: (color: string) => void;
  getBrushColor: () => string;
  setBrushShape: (shape: ShapeTemplate) => void;
  setBrushSize: (size: number) => void;
  setBrushMode: (mode: PaintMode) => void;
  setPanViewEnabled: (enabled: boolean) => void;
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

  // adds without undo/redo
  addFeatureImmediate: (
    feature: BrushFeature,
    brushOperation: BrushOperation
  ) => void;

  // removes without undo/redo
  removeFeatureImmediate: (feature: BrushFeature) => void;

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

  setPanViewEnabled: (enabled: boolean) =>
    set((state) => ({ ...state, isPanViewEnabled: enabled })),

  setBrushOperation: (brushOperation: BrushOperation) =>
    set((state) => ({ ...state, brushOperation })),

  getBrushOperation: () => get().brushOperation,

  setBrushColor: (color: string) =>
    set((state) =>
      // applyAction(state, { type: ActionType.SET_BRUSH_COLOR, color })
      ({ ...state, brushColor: color })
    ),

  setBrushShape: (shape: ShapeTemplate) =>
    set((state) => ({ ...state, brushShape: shape })),

  setBrushMode: (mode: PaintMode) =>
    set((state) => ({ ...state, brushMode: mode })),

  setBrushSize: (size: number) =>
    set((state) => ({ ...state, brushSize: size })),

  getBrushColor: () => get().brushColor,

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
    set((state) => {
      if (state.selectedFeatures.length === 0) {
        return state;
      }
      return applyAction(state, {
        type: ActionType.REMOVE_BRUSH,
        featureIds: state.selectedFeatures
      });
    }),

  removeFeature: (feature: BrushFeature) =>
    set((state) =>
      applyAction(state, {
        type: ActionType.REMOVE_BRUSH,
        featureIds: [feature.id! as string]
      })
    ),

  // adds without undo/redo
  addFeatureImmediate: (
    feature: BrushFeature,
    brushOperation: BrushOperation = BrushOperation.ADD
  ) =>
    set((state) =>
      applyActionInternal(state, {
        type: ActionType.ADD_BRUSH,
        feature,
        brushOperation
      })
    ),

  // removes without undo/redo
  removeFeatureImmediate: (feature: BrushFeature) =>
    set((state) =>
      applyActionInternal(state, {
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
