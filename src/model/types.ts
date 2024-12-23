import shapes from '@assets/shapes.json';
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

export const BrushOperation = {
  ADD: 'add',
  SUBTRACT: 'subtract',
  INTERSECT: 'intersect'
} as const;

export type BrushOperation =
  (typeof BrushOperation)[keyof typeof BrushOperation];

export type AddBrushAction = {
  type: typeof ActionType.ADD_BRUSH;
  brushOperation: BrushOperation;
  feature: BrushFeature;
  options?: AddFeatureOptions;
};

export type RemoveBrushAction = {
  type: typeof ActionType.REMOVE_BRUSH;
  featureIds: string[];
};

export type MoveBrushAction = {
  type: typeof ActionType.MOVE_BRUSH;
  brushOperation: BrushOperation;
  feature: BrushFeature;
  translation: Vector2;
  options?: MoveFeatureOptions;
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
  brushOperation?: BrushOperation;
  selectFeature?: boolean;
};

export type MoveFeatureOptions = AddFeatureOptions;

export type ShapeTemplate = keyof typeof shapes;

export const PaintMode = {
  PAINT: 'paint',
  PLACE: 'place'
} as const;

export type PaintMode = (typeof PaintMode)[keyof typeof PaintMode];
