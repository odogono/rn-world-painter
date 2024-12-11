import type { LayoutRectangle } from 'react-native';

import { SkMatrix, Skia } from '@shopify/react-native-skia';
import {
  Easing,
  makeMutable,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { StateCreator } from 'zustand';

import { createLogger } from '@helpers/log';
import { Vector2Create, Vector2MultiplyScalar } from '@helpers/vector2';
import { BBox, Mutable, Vector2 } from '@types';

export type ViewSliceProps = {
  mViewPosition: Mutable<Vector2>;
  mViewScale: Mutable<number>;

  mViewMatrix: Mutable<SkMatrix>;
  mViewBBox: Mutable<BBox>;
  mViewInverseMatrix: Mutable<SkMatrix>;

  viewWidth: number;
  viewHeight: number;
  viewLayout: LayoutRectangle;
};

export type MoveToPositionOptions = {
  duration?: number;
  after?: number;
};

export type ViewSliceActions = {
  setViewPosition: (position: Vector2, scale?: number) => void;

  moveToPosition: (
    position: Vector2,
    scale?: number,
    options?: MoveToPositionOptions
  ) => void;

  convertWorldToScreen: (position: Vector2) => Vector2;

  setViewScreenDims: (width: number, height: number) => void;
};

export type ViewSlice = ViewSliceProps & ViewSliceActions;

const defaultState: ViewSliceProps = {
  mViewPosition: makeMutable<Vector2>({ x: 0, y: 0 }),
  mViewScale: makeMutable<number>(1),
  mViewMatrix: makeMutable<SkMatrix>(Skia.Matrix()),
  mViewInverseMatrix: makeMutable<SkMatrix>(Skia.Matrix()),
  mViewBBox: makeMutable<BBox>([0, 0, 0, 0]),
  viewWidth: 0,
  viewHeight: 0,
  viewLayout: { width: 0, height: 0, x: 0, y: 0 }
};

const log = createLogger('viewSlice');

export const createViewSlice: StateCreator<ViewSlice, [], [], ViewSlice> = (
  set,
  get
) => ({
  ...defaultState,

  setViewPosition: (
    position: Vector2,
    scale: number = defaultState.mViewScale.value
  ) => {
    const { mViewPosition, mViewScale } = get();
    mViewPosition.value = position;
    mViewScale.value = scale;
  },

  setViewScreenDims: (width: number, height: number) =>
    set((state) => ({
      viewWidth: width,
      viewHeight: height,
      viewLayout: { width, height, x: 0, y: 0 }
    })),

  convertWorldToScreen: (position: Vector2) => {
    const { mViewScale } = get();
    return Vector2MultiplyScalar(Vector2Create(), position, mViewScale.value);
    // return vec2.scale(vec2.create(), position, mViewScale.value);
  },

  moveToPosition: (
    position: Vector2,
    scale: number = defaultState.mViewScale.value,
    options?: MoveToPositionOptions
  ) => {
    // convert position from world to screen
    // todo: cant yet explain why this works
    // the transformation is just scaling, which should
    // already be handled by mViewMatrix
    const screenPosition = get().convertWorldToScreen(position);

    const { mViewPosition, mViewScale } = get();

    const duration = options?.duration ?? 300;
    const after = options?.after ?? 0;

    mViewPosition.value = withDelay(
      after,
      withTiming(screenPosition, {
        duration,
        easing: Easing.inOut(Easing.ease)
      })
    );
    mViewScale.value = withDelay(
      after,
      withTiming(scale, {
        duration,
        easing: Easing.inOut(Easing.ease)
      })
    );
  }
});
