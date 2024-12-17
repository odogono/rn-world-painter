import { shallow } from 'zustand/shallow';

import { useStoreSelector } from './useStore';

export const useStoreActions = () => {
  const result = useStoreSelector(
    (state) => ({
      setViewPosition: state.setViewPosition,
      moveToPosition: state.moveToPosition,
      resetFeatures: state.resetFeatures,
      getVisibleFeatures: state.getVisibleFeatures,
      handleTap: state.handleTap
    }),
    shallow
  );

  return result;
};
