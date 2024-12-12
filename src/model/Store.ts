import { createStore as createZustandStore } from 'zustand';

import {
  FeatureSlice,
  FeatureSliceProps,
  createFeatureSlice
} from './slices/featureSlice';
import { ViewSlice, ViewSliceProps, createViewSlice } from './slices/viewSlice';

export type StoreState = ViewSlice & FeatureSlice;

export type StoreProps = ViewSliceProps & FeatureSliceProps;

export type Store = ReturnType<typeof createStore>;

export const createStore = (initialState: Partial<StoreProps>) => {
  return createZustandStore<StoreState>()((...args) => ({
    ...createViewSlice(...args),
    ...createFeatureSlice(...args),
    ...initialState
  }));
};

export const store = createStore({});
