import { createContext, useContext, useState } from 'react';

import { createStore, useStore } from 'zustand';

import { createLogger } from '@helpers/log';
import { createSelectors, type WithSelectors } from '@helpers/zustand';
import { Vector2 } from '@types';

const log = createLogger('FlowerMenuStore');

type Node = {
  id: string;
  name: string;
  icon?: string;
  children?: Node[];
};

const data: Node[] = [
  {
    id: 'root',
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
];

const findNodeById = (nodes: Node[], id: string): Node | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const result = findNodeById(node.children, id);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

const getChildNodeIds = (nodes: Node[], nodeId?: string): string[] => {
  if (!nodeId) {
    return (
      findNodeById(nodes, 'root')?.children?.map((child) => child.id) ?? []
    );
  }
  const children = findNodeById(nodes, nodeId)?.children ?? [];
  return children.map((child) => child.id);
};

const createNodeState = (node: Node): NodeState => {
  return {
    id: node.id,
    name: node.name,
    icon: node.icon,
    position: { x: 0, y: 0 },
    selectedChild: (node.children?.length ?? 0) === 0 ? -1 : 0,
    children: node.children?.map((child) => child.id) ?? [],
    isOpen: false
  };
};

export type NodeState = {
  id: string;
  name: string;
  icon?: string;
  position: Vector2;
  selectedChild: number;
  children: string[];
  isOpen: boolean;
};

export interface FlowerMenuStoreProps {
  nodes: Record<string, NodeState>;
}

export interface FlowerMenuStoreState extends FlowerMenuStoreProps {
  initialise: () => void;
  open: (nodeId: string) => void;

  getNodeState: (nodeId: string) => NodeState | undefined;
  getNodeIcon: (nodeId: string) => string | undefined;
  getChildNodeIds: (nodeId?: string) => string[];
  handleNodeTap: (nodeId: string) => void;
  handleNodeLongPress: (nodeId: string) => void;
}

const defaultProps: FlowerMenuStoreProps = {
  nodes: {}
};

export type FlowerMenuStore = ReturnType<typeof createFlowerMenuStore>;

export const createFlowerMenuStore = (
  props?: Partial<FlowerMenuStoreProps>
) => {
  // vanilla store
  return createStore<FlowerMenuStoreState>()((set, get) => ({
    ...defaultProps,
    ...props,

    initialise: () => {},
    getChildNodeIds: (nodeId?: string) => {
      return getChildNodeIds(data, nodeId);
    },
    getNodeState: (nodeId: string) => {
      const node = get().nodes[nodeId];
      if (node) {
        return node;
      }

      const dataNode = findNodeById(data, nodeId);

      if (!dataNode) {
        throw new Error(`Node ${nodeId} not found`);
      }

      const nodeState = createNodeState(dataNode);
      set((prev) => ({ nodes: { ...prev.nodes, [nodeId]: nodeState } }));
      return nodeState;
      // return get().rootNodes.find((node) => node.id === nodeId);
    },

    getNodeIcon: (nodeId: string) => {
      const node = get().getNodeState(nodeId);

      if (!node) {
        throw new Error(`Undefined Node ${nodeId}`);
      }

      if (node?.icon) {
        return node.icon;
      }

      const { selectedChild, children } = node;

      // log.debug(
      //   'getNodeIcon',
      //   nodeId,
      //   'selectedChild',
      //   selectedChild,
      //   children[selectedChild]
      // );

      if (selectedChild >= 0 && selectedChild < children.length) {
        return get().getNodeIcon(children[selectedChild]);
      }

      return undefined;
    },

    open: (nodeId: string) => {},
    handleNodeTap: (nodeId: string) =>
      set((state) => {
        // log.debug('handleNodeTap', nodeId);

        const nodeState = state.getNodeState(nodeId);

        if (!nodeState) {
          throw new Error(`Node ${nodeId} not found`);
        }

        const { selectedChild, children } = nodeState;

        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              ...nodeState,
              selectedChild: (selectedChild + 1) % children.length
            }
          }
        };
        // change the state to the next child, or activate if it has no children

        // return state;
      }),
    handleNodeLongPress: (nodeId: string) => {
      log.debug('handleNodeLongPress', nodeId);
    }
  }));
};
