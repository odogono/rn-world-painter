import { shallow } from 'zustand/shallow';

import { useStoreState } from './useStore';

export const useStoreActions = () => {
  const result = useStoreState(
    (state) => ({
      setViewPosition: state.setViewPosition,
      moveToPosition: state.moveToPosition
    }),
    shallow
  );

  return result;
};
