import { BrushFeature, Vector2 } from '@types';

export const ActionType = {
  ADD_BRUSH: 'addBrush',
  REMOVE_BRUSH: 'removeBrush',
  REMOVE_SELECTED: 'removeSelected',
  MOVE_BRUSH: 'moveBrush',
  SET_BRUSH_COLOR: 'setBrushColor',
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

export type MoveBrushAction = {
  type: typeof ActionType.MOVE_BRUSH;
  brushMode: BrushMode;
  feature: BrushFeature;
  translation: Vector2;
  options?: AddFeatureOptions;
};

export type SetBrushColorAction = {
  type: typeof ActionType.SET_BRUSH_COLOR;
  color: string;
};

export type Action =
  | AddBrushAction
  | RemoveBrushAction
  | MoveBrushAction
  | SetBrushColorAction;

export type AddFeatureOptions = {
  updateBBox?: boolean;
  brushMode?: BrushMode;
  selectFeature?: boolean;
};
