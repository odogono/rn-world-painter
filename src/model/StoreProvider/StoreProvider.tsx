/* eslint-disable react-compiler/react-compiler */
import { useCallback, useRef } from 'react';

import { useAnimatedReaction, withTiming } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { Vector2 } from '@types';
import { store, type Store, type StoreProps } from '../Store';
import {
  CalculateZoomProps,
  calculateZoom as calculateZoomInternal
} from '../helpers/calculateZoom';
import { StoreContext } from './context';

type AdditionalProps = {
  importState?: any;
};

type ProviderProps = React.PropsWithChildren<
  Partial<StoreProps> & AdditionalProps
>;

export const StoreProvider = ({
  children,
  importState: importStateProp,
  ...props
}: ProviderProps) => {
  const storeRef = useRef<Store>();

  if (!storeRef.current) {
    storeRef.current = store;
  }

  const {
    mViewPosition,
    mViewScale,
    mViewMatrix,
    mViewInverseMatrix,
    mViewBBox
  } = storeRef.current.getState();

  const viewWidth = useStore(storeRef.current, (state) => state.viewWidth);
  const viewHeight = useStore(storeRef.current, (state) => state.viewHeight);

  useAnimatedReaction(
    () => [mViewPosition.value, mViewScale.value] as [Vector2, number],
    ([position, scale]) => {
      const { x, y } = position;

      // update the bbox
      const [sx, sy] = [x / scale, y / scale];
      const width = viewWidth / scale;
      const height = viewHeight / scale;
      const hWidth = width / 2;
      const hHeight = height / 2;

      mViewBBox.value = [sx - hWidth, sy - hHeight, sx + hWidth, sy + hHeight];

      // as the matrix is a complex object,
      // we modify rather than reassign
      mViewMatrix.modify((m) => {
        m.identity();

        // Translate to the center of the screen
        m.translate(viewWidth / 2, viewHeight / 2);

        m.translate(-x, -y);

        // Apply scale around the current position
        m.scale(scale, scale);

        return m;
      });

      mViewInverseMatrix.modify((m) => {
        m.identity();

        // Invert the operations in reverse order
        m.scale(1 / scale, 1 / scale);

        m.translate(x, y);

        m.translate(-viewWidth / 2, -viewHeight / 2);

        return m;
      });
    }
  );

  const worldToScreen = useCallback((point: Vector2): Vector2 => {
    'worklet';
    const { x, y } = point;
    const [a, b, c, d, e, f] = mViewMatrix.value.get();

    const screenX = a * x + b * y + c;
    const screenY = d * x + e * y + f;

    return { x: screenX, y: screenY };
  }, []);

  const screenToWorld = useCallback((point: Vector2): Vector2 => {
    'worklet';
    const { x, y } = point;
    const [a, b, c, d, e, f] = mViewInverseMatrix.value.get();

    const worldX = a * x + b * y + c;
    const worldY = d * x + e * y + f;

    return { x: worldX, y: worldY };
  }, []);

  const calculateZoom = useCallback((props: CalculateZoomProps) => {
    'worklet';
    // Convert focal point to world coordinates before scaling
    const worldFocalPoint = screenToWorld(props.focalPoint);
    return calculateZoomInternal({
      ...props,
      worldFocalPoint,
      scale: mViewScale.value,
      position: mViewPosition.value
    });
  }, []);

  const zoomOnPoint = useCallback(
    (focalPoint: Vector2, zoomFactor: number, duration: number = 300) => {
      const { position: toPos, scale: toScale } = calculateZoom({
        focalPoint,
        zoomFactor
      });
      mViewPosition.value = withTiming(toPos, { duration });
      mViewScale.value = withTiming(toScale, { duration });
    },
    []
  );

  // log.debug('render', !!storeRef.current);

  return (
    <StoreContext.Provider
      value={{
        mViewPosition,
        mViewScale,
        mViewBBox,
        store: storeRef.current,
        worldToScreen,
        screenToWorld,
        zoomOnPoint
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
