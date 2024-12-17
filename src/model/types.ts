import { BrushFeature } from '@types';

export const ActionType = {
  ADD_BRUSH: 'addBrush',
  REMOVE_BRUSH: 'removeBrush',
  REMOVE_SELECTED: 'removeSelected',
  RESET: 'reset'
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export const ApplyOperation = {
  ADD: 'add',
  SUBTRACT: 'subtract',
  INTERSECT: 'intersect'
} as const;

export type ApplyOperation =
  (typeof ApplyOperation)[keyof typeof ApplyOperation];

export type AddBrushAction = {
  type: typeof ActionType.ADD_BRUSH;
  apply: ApplyOperation;
  feature: BrushFeature;
  options?: AddFeatureOptions;
};

export type RemoveBrushAction = {
  type: typeof ActionType.REMOVE_BRUSH;
  featureId: string;
};

export type RemoveSelectedAction = {
  type: typeof ActionType.REMOVE_SELECTED;
};

// export type Action = {
//   featureId?: string;
//   type: ActionType;
//   apply: ApplyOperation;
//   feature?: BrushFeature;
//   options?: Partial<AddFeatureOptions>;
// };

export type Action = AddBrushAction | RemoveBrushAction;

export type AddFeatureOptions = {
  updateBBox?: boolean;
  applyOperation?: ApplyOperation;
};
