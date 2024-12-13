import { createContext, useContext, useState } from 'react';

import { createStore, useStore } from 'zustand';

import { Vector2 } from '@types';

const data = {
  root: {
    name: 'root',
    children: [
      {
        id: 'edit',
        name: 'Edit',
        icon: 'edit'
      },
      {
        id: 'move',
        name: 'Move',
        icon: 'open_with',
        children: [
          {
            id: 'pan',
            name: 'Pan',
            icon: 'pan-tool'
          },
          {
            id: 'zoom_in',
            name: 'Zoom In',
            icon: 'zoom_in_map'
          },
          {
            id: 'zoom_out',
            name: 'Zoom Out',
            icon: 'zoom_out_map'
          },
          {
            id: 'reset',
            name: 'Reset',
            icon: 'refresh'
          }
        ]
      },
      {
        id: 'history',
        name: 'History',
        icon: 'history',
        children: [
          {
            id: 'undo',
            name: 'Undo',
            icon: 'undo'
          },
          {
            id: 'redo',
            name: 'Redo',
            icon: 'redo'
          }
        ]
      }
    ]
  }
};

export type FlowerNode = {
  id: string;
  name: string;
  icon: string;
  position: Vector2;
  selectedChild: number;
  children: string[];
  isOpen: boolean;
};

export interface FlowerMenuStoreProps {
  rootNodes: FlowerNode[];
}

export interface FlowerMenuStoreState extends FlowerMenuStoreProps {
  initialise: () => void;
  open: (nodeId: string) => void;
}

const defaultProps: FlowerMenuStoreProps = {
  rootNodes: []
};

type FlowerMenuStore = ReturnType<typeof createFlowerMenuStore>;

export const createFlowerMenuStore = (
  props?: Partial<FlowerMenuStoreProps>
) => {
  return createStore<FlowerMenuStoreState>()((set) => ({
    ...defaultProps,
    ...props,

    initialise: () => {
      // set({
      //   rootNodes: data.root.children.map((node) => ({
      //     ...node,
      //     isOpen: false
      //   }))
      // });
    },
    open: (nodeId: string) => {}
  }));
};

export const FlowerMenuStoreContext = createContext<FlowerMenuStore | null>(
  null
);

type FlowerMenuStoreProviderProps = React.PropsWithChildren<
  Partial<FlowerMenuStoreProps>
>;

export const FlowerMenuStoreProvider = ({
  children,
  ...props
}: FlowerMenuStoreProviderProps) => {
  const [store, setStore] = useState<FlowerMenuStore | null>(null);

  if (store === null) {
    const newStore = createFlowerMenuStore(props);
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
