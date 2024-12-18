import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import type { Handler, WildcardHandler } from 'mitt';
import { useStore } from 'zustand';

import { WithSelectors, createSelectors } from '@helpers/zustand';
import { FlowerMenuEvents } from './events';
import { openChildren } from './helpers';
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

    setStore(newStore);
  }

  const onForceCloseNode = useCallback(
    ({ id }: { id: string }) => {
      store?.setState((prevState) => ({
        ...prevState,
        nodes: {
          ...prevState.nodes,
          [id]: {
            ...prevState.nodes[id],
            isOpen: false
          }
        }
      }));
    },
    [store]
  );

  const onLayoutView = useCallback(() => {
    if (!store) return;
    let state = store.getState();
    Object.values(state.nodes).forEach((node) => {
      if (node.isOpen) {
        state = openChildren(state, node.id, false);
      }
    });
    store?.setState(() => state);
  }, [store]);

  useEffect(() => {
    const state = store?.getState();

    if (state) {
      if (onEvent) {
        state.events.on('*', onEvent);
      }
      if (onNodeSelect) {
        state.events.on('node:select', onNodeSelect);
      }

      // used by the closeChildren helper to properly close
      // a parent after the animations have done
      state.events.on('node:close:force', onForceCloseNode);

      state.events.on('view:layout', onLayoutView);
    }
    return () => {
      const state = store?.getState();
      if (!state) return;
      if (onEvent) {
        state.events.off('*', onEvent);
      }
      if (onNodeSelect) {
        state.events.off('node:select', onNodeSelect);
      }
      state.events.off('node:close:force', onForceCloseNode);
      state.events.off('view:layout', onLayoutView);
    };
  }, [store, onEvent, onNodeSelect]);

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
