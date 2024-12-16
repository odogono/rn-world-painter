import { createContext, useContext, useState } from 'react';

import type { Handler, WildcardHandler } from 'mitt';
import { useStore } from 'zustand';

import { WithSelectors, createSelectors } from '@helpers/zustand';
import { FlowerMenuEvents } from './events';
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
    onEvent?: WildcardHandler<FlowerMenuEvents> | undefined;
    onNodeSelect?: Handler<{ id: string }>;
  }
>;

export const FlowerMenuStoreProvider = ({
  children,
  onEvent,
  onNodeSelect,
  ...props
}: FlowerMenuStoreProviderProps) => {
  const [store, setStore] = useState<FlowerMenuStoreWithSelectors | null>(null);

  if (store === null) {
    const newStore = createSelectors(createFlowerMenuStore(props));
    const state = newStore.getState();
    state.initialise();

    if (onEvent) {
      state.events.on('*', onEvent);
    }
    if (onNodeSelect) {
      state.events.on('node:select', onNodeSelect);
    }

    // used by the closeChildren helper to properly close
    // a parent after the animations have done
    state.events.on('node:close:force', ({ id }) => {
      newStore.setState((prevState) => ({
        ...prevState,
        nodes: {
          ...prevState.nodes,
          [id]: {
            ...prevState.nodes[id],
            isOpen: false
          }
        }
      }));
    });

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
