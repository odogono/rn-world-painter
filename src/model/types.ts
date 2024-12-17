import { BrushFeature } from '@types';

export const ActionType = {
  ADD_BRUSH: 'addBrush',
  REMOVE_BRUSH: 'removeBrush',
  REMOVE_SELECTED: 'removeSelected',
  RESET: 'reset'
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export const BrushMode = {
  ADD: 'add',
  SUBTRACT: 'subtract',
  INTERSECT: 'intersect'
} as const;

export type BrushMode = (typeof BrushMode)[keyof typeof BrushMode];

export type AddBrushAction = {
  type: typeof ActionType.ADD_BRUSH;
  brushMode: BrushMode;
  feature: BrushFeature;
  options?: AddFeatureOptions;
};

export type RemoveBrushAction = {
  type: typeof ActionType.REMOVE_BRUSH;
  featureIds: string[];
};

// export type RemoveSelectedAction = {
//   type: typeof ActionType.REMOVE_SELECTED;
// };

export type Action = AddBrushAction | RemoveBrushAction;

export type AddFeatureOptions = {
  updateBBox?: boolean;
  brushMode?: BrushMode;
};
