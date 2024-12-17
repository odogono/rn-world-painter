import { useCallback } from 'react';

import { useStore } from '@model/useStore';
import { Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

export const useMoveView = (): UseGestureProps => {
  const { mViewPosition } = useStore();

  const onChange = useCallback(({ x, y }: Vector2) => {
    'worklet';
    mViewPosition.modify((pos) => {
      pos.x -= x;
      pos.y -= y;
      return pos;
    });
  }, []);

  return {
    onChange
  };
};
