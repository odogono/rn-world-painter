import { createLogger } from '@helpers/log';
import {
  Action,
  ActionType,
  AddBrushAction,
  MoveBrushAction,
  RemoveBrushAction,
  SetBrushColorAction
} from '../types';
import { addFeature, moveFeature, removeFeatures } from './featureHelpers';
import { FeatureSlice } from './featureSlice';

const log = createLogger('actions');

export const replayActions = (state: FeatureSlice) => {
  // clear everything
  const newState = { ...state, features: [], selectedFeatures: [] };
  newState.spatialIndex.clear();

  return state.undoStack.reduce<FeatureSlice>((state, action) => {
    return applyActionInternal(state, action);
  }, newState);
};

export const applyAction = (state: FeatureSlice, action: Action) => {
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

export const undoAction = (state: FeatureSlice) => {
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

export const redoAction = (state: FeatureSlice) => {
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

export const applyActionInternal = (state: FeatureSlice, action: Action) => {
  switch (action.type) {
    case ActionType.ADD_BRUSH:
      return addFeature({
        state,
        brushMode: action.brushMode,
        feature: action.feature,
        options: action.options ?? {}
      });
    case ActionType.MOVE_BRUSH:
      return moveFeature({
        state,
        brushMode: action.brushMode,
        feature: action.feature,
        translation: action.translation,
        options: action.options ?? {}
      });
    case ActionType.REMOVE_BRUSH:
      return removeFeatures(state, action.featureIds);
    case ActionType.SET_BRUSH_COLOR:
      return { ...state, brushColor: action.color };
    default:
      return state;
  }
};

export const printHistory = (state: FeatureSlice) => {
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

export const actionToString = (action: Action) => {
  switch (action.type) {
    case ActionType.ADD_BRUSH:
      return addBrushActionToString(action as AddBrushAction);
    case ActionType.REMOVE_BRUSH:
      return removeBrushActionToString(action as RemoveBrushAction);
    case ActionType.MOVE_BRUSH:
      return moveBrushActionToString(action as MoveBrushAction);
    case ActionType.SET_BRUSH_COLOR:
      return setBrushColorActionToString(action as SetBrushColorAction);
    default:
      return JSON.stringify(action);
  }
};

const addBrushActionToString = (action: AddBrushAction) => {
  return `${action.type} ${action.brushMode} ${action.feature?.id}`;
};

const removeBrushActionToString = (action: RemoveBrushAction) => {
  return `${action.type} ${action.featureIds.join(', ')}`;
};

const moveBrushActionToString = (action: MoveBrushAction) => {
  return `${action.type} ${action.feature?.id} ${action.brushMode} ${action.translation.x}, ${action.translation.y}`;
};

const setBrushColorActionToString = (action: SetBrushColorAction) => {
  return `${action.type} ${action.color}`;
};
