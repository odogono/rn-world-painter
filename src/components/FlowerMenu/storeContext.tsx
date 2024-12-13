import { createContext, useContext, useState } from 'react';

import { useStore } from 'zustand';

import { WithSelectors, createSelectors } from '@helpers/zustand';
import {
  FlowerMenuStore,
  FlowerMenuStoreProps,
  FlowerMenuStoreState,
  createFlowerMenuStore
} from './store';

type FlowerMenuStoreWithSelectors = WithSelectors<FlowerMenuStore>;

export const FlowerMenuStoreContext =
  createContext<FlowerMenuStoreWithSelectors | null>(null);

type FlowerMenuStoreProviderProps = React.PropsWithChildren<
  Partial<FlowerMenuStoreProps>
>;

export const FlowerMenuStoreProvider = ({
  children,
  ...props
}: FlowerMenuStoreProviderProps) => {
  const [store, setStore] = useState<FlowerMenuStoreWithSelectors | null>(null);

  if (store === null) {
    const newStore = createSelectors(createFlowerMenuStore(props));
    setStore(newStore);
  }

  return (
    <FlowerMenuStoreContext.Provider value={store}>
      {children}
    </FlowerMenuStoreContext.Provider>
  );
};

export const useFlowerMenuStore = <T,>(
  selector: (state: FlowerMenuStoreState) => T
): T => {
  const store = useContext(FlowerMenuStoreContext);
  if (!store) throw new Error('FlowerMenuStoreProvider not found');
  return useStore(store, selector);
};

export const useMenuStore = () => {
  const store = useContext(FlowerMenuStoreContext);
  if (!store) throw new Error('FlowerMenuStoreProvider not found');
  return store;
};
