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
  Partial<FlowerMenuStoreProps> & {
    onEvent: (event: any) => void;
  }
>;

export const FlowerMenuStoreProvider = ({
  children,
  onEvent,
  ...props
}: FlowerMenuStoreProviderProps) => {
  const [store, setStore] = useState<FlowerMenuStoreWithSelectors | null>(null);

  if (store === null) {
    const newStore = createSelectors(createFlowerMenuStore(props));
    newStore.getState().initialise();
    newStore.getState().events.on('*', onEvent);
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

export const useFlowerMenuNode = (nodeId: string) => {
  return useFlowerMenuStore((s) => s.nodes[nodeId]);
};

export const useFlowerMenuEvents = () => {
  const store = useContext(FlowerMenuStoreContext);
  if (!store) throw new Error('FlowerMenuStoreProvider not found');
  return store.getState().events;
};
