import { useContext } from 'react';
import { LayoutRectangle } from 'react-native';

import { useStoreWithEqualityFn } from 'zustand/traditional';

import type { StoreState } from './Store';
import { StoreContext } from './StoreProvider/context';

export const useStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore not ready');
  }

  return context;
};

export const useStoreSelector = <T>(
  selector: (state: StoreState) => T,
  equalityFn?: (left: T, right: T) => boolean
): T => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return useStoreWithEqualityFn(context.store, selector, equalityFn);
};

export const useStoreState = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context.store;
};

export const useStoreViewDims = () => {
  return useStoreSelector((state) => ({
    width: state.viewWidth,
    height: state.viewHeight,
    viewLayout: state.viewLayout,
    setViewDims: state.setViewScreenDims
  }));
};

export const useStoreViewLayout = (): LayoutRectangle => {
  return useStoreState().use.viewLayout();
  // return useStoreSelector((state) => state.viewLayout);
};

export const useStoreSetViewLayout = () => {
  return useStoreState().use.setViewScreenDims();
  // return useStoreSelector((state) => state.setViewScreenDims);
};
