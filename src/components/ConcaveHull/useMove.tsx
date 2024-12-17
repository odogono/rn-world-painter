import { useCallback } from 'react';

import { runOnJS } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { Vector2 } from '@types';
import { UseGestureProps } from './useGesture';

const log = createLogger('useMove');

export const useMove = (): UseGestureProps => {
  const onStart = useCallback(() => {
    'worklet';

    // start the move
    runOnJS(log.debug)('startMove');
  }, []);

  const onChange = useCallback(({ x, y }: Vector2) => {
    'worklet';

    runOnJS(log.debug)('updateMove', { x, y });
  }, []);

  const onEnd = useCallback(() => {
    'worklet';

    runOnJS(log.debug)('endMove');
  }, []);

  return {
    onStart,
    onChange,
    onEnd
  };
};
