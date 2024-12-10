import { createStore as createZustandStore } from 'zustand';

import { ViewSlice, ViewSliceProps, createViewSlice } from './slices/viewSlice';

export type StoreState = ViewSlice;

export type StoreProps = ViewSliceProps;

export type Store = ReturnType<typeof createStore>;

export const createStore = (initialState: Partial<StoreProps>) => {
  return createZustandStore<StoreState>()((...args) => ({
    ...createViewSlice(...args),

    ...initialState
  }));
};

export const store = createStore({});
