import { shallow } from 'zustand/shallow';

import { useStoreState } from './useStore';

export const useStoreActions = () => {
  const result = useStoreState(
    (state) => ({
      setViewPosition: state.setViewPosition,
      moveToPosition: state.moveToPosition,
      addFeature: state.addFeature,
      resetFeatures: state.resetFeatures,
      getVisibleFeatures: state.getVisibleFeatures
    }),
    shallow
  );

  return result;
};
