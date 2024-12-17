/* eslint-disable react-compiler/react-compiler */
import { useCallback, useRef } from 'react';

import {
  runOnJS,
  useAnimatedReaction,
  withTiming
} from 'react-native-reanimated';
import { useStore } from 'zustand';

import { createLogger } from '@helpers/log';
import { Position, Vector2 } from '@types';
import { store, type Store, type StoreProps } from '../Store';
import {
  CalculateZoomProps,
  calculateZoom as calculateZoomInternal
} from '../helpers/calculateZoom';
// eslint-disable-next-line import/order
import { StoreContext, ZoomOnPointProps } from './context';

type AdditionalProps = {
  importState?: any;
};

type ProviderProps = React.PropsWithChildren<
  Partial<StoreProps> & AdditionalProps
>;

const log = createLogger('StoreProvider');

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

  const viewLayout = storeRef.current.use.viewLayout();

  useAnimatedReaction(
    () => [mViewPosition.value, mViewScale.value] as [Vector2, number],
    ([position, scale]) => {
      const { x, y } = position;

      // update the bbox
      const [sx, sy] = [x / scale, y / scale];
      const width = viewLayout.width / scale;
      const height = viewLayout.height / scale;
      const hWidth = width / 2;
      const hHeight = height / 2;

      mViewBBox.value = [sx - hWidth, sy - hHeight, sx + hWidth, sy + hHeight];

      // as the matrix is a complex object,
      // we modify rather than reassign
      mViewMatrix.modify((m) => {
        m.identity();

        // Translate to the center of the screen
        m.translate(viewLayout.width / 2, viewLayout.height / 2);

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

        m.translate(-viewLayout.width / 2, -viewLayout.height / 2);

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

  const screenToWorldPoints = useCallback((points: Position[]): Position[] => {
    'worklet';

    const [a, b, c, d, e, f] = mViewInverseMatrix.value.get();

    const worldPoints = points.map((point) => {
      const worldX = a * point[0] + b * point[1] + c;
      const worldY = d * point[0] + e * point[1] + f;
      return [worldX, worldY] as Position;
    });

    return worldPoints;
  }, []);

  const calculateZoom = useCallback((props: CalculateZoomProps) => {
    'worklet';
    // Convert focal point to world coordinates before scaling
    // const worldFocalPoint = screenToWorld(props.focalPoint);

    // runOnJS(log.debug)('calculateZoom', worldFocalPoint.x, worldFocalPoint.y);

    return calculateZoomInternal({
      ...props,
      // worldFocalPoint,
      scale: mViewScale.value,
      position: props.focalPoint ?? mViewPosition.value
    });
  }, []);

  const zoomOnPoint = useCallback(
    ({
      focalPoint,
      zoomFactor = 1,
      duration = 300,
      toScale
    }: ZoomOnPointProps) => {
      if (!focalPoint) {
        focalPoint = mViewPosition.value;
      } else {
        focalPoint = mViewPosition.value;
        // focalPoint = screenToWorld(focalPoint);
      }

      // runOnJS(log.debug)('zoomOnPoint', focalPoint.x, focalPoint.y);
      const { position: toPos, scale } = calculateZoom({
        focalPoint,
        zoomFactor,
        toScale
      });

      if (duration) {
        mViewPosition.value = withTiming(toPos, { duration });
        mViewScale.value = withTiming(scale, { duration });
      } else {
        mViewPosition.value = toPos;
        mViewScale.value = scale;
      }
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
        screenToWorldPoints,
        zoomOnPoint,
        viewLayout
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
