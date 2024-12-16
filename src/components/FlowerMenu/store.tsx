import { createContext, useContext, useState } from 'react';

import { makeMutable } from 'react-native-reanimated';
import { createStore, useStore } from 'zustand';

import { createLogger } from '@helpers/log';
import { createSelectors, type WithSelectors } from '@helpers/zustand';
import { LayoutInsets, Vector2 } from '@types';
import {
  FlowerMenuSpatialIndex,
  createSpatialIndex
} from './flowerMenuSpatialIndex';
import type { NodeState } from './types';

const log = createLogger('FlowerMenuStore');

type Node = {
  id: string;
  name: string;
  icon?: string;
  openOnFocus?: boolean;
  children?: Node[];
};

const simpleData: Node[] = [
  {
    id: 'root',
    name: 'Root',
    icon: 'edit'
  }
];

const data: Node[] = [
  {
    id: 'root',
    name: 'root',
    children: [
      {
        id: 'move',
        name: 'Move',
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
        id: 'edit',
        name: 'Edit',
        icon: 'edit'
      },
      {
        id: 'history',
        name: 'History',
        openOnFocus: true,
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

const createNodes = (
  data: Node[],
  result: Record<string, NodeState>,
  parentId?: string
) => {
  for (const node of data) {
    const nodeState = createNodeState(node, parentId);
    result[node.id] = nodeState;

    if (node.children) {
      createNodes(node.children, result, node.id);
    }
  }

  return result;
};

const getChildNodeIds = (
  nodes: Record<string, NodeState>,
  nodeId?: string
): string[] => {
  if (!nodeId) {
    return Object.values(nodes)
      .filter((node) => !node.parentId)
      .map((node) => node.id);
  }

  const node = nodes[nodeId];

  if (!node) {
    throw new Error(`Undefined node ${nodeId}`);
  }

  return node.children;
};

const createNodeState = (node: Node, parentId?: string): NodeState => {
  return {
    id: node.id,
    name: node.name,
    icon: node.icon,
    position: makeMutable({ x: 430 / 2, y: 932 / 2 }),
    selectedChild: (node.children?.length ?? 0) === 0 ? -1 : 0,
    children: node.children?.map((child) => child.id) ?? [],
    parentId,
    isOpen: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 }
  };
};

export interface FlowerMenuStoreProps {
  nodes: Record<string, NodeState>;
  selectedNodeId: Record<string, string>;
  spatialIndex: FlowerMenuSpatialIndex;
  insets: LayoutInsets;
}

export interface FlowerMenuStoreState extends FlowerMenuStoreProps {
  initialise: () => void;
  open: (nodeId: string) => void;

  getNodeState: (nodeId: string) => NodeState | undefined;
  getNodeIcon: (nodeId: string) => string | undefined;
  getChildNodeIds: (nodeId?: string) => string[];
  handleNodeSelect: (nodeId: string) => void;
  handleNodeLongPress: (nodeId: string) => void;
}

const defaultProps: FlowerMenuStoreProps = {
  nodes: {},
  selectedNodeId: {},
  spatialIndex: createSpatialIndex(),
  insets: { left: 10, top: 10, right: 10, bottom: 10 }
};

export type FlowerMenuStore = ReturnType<typeof createFlowerMenuStore>;

export const createFlowerMenuStore = (
  props?: Partial<FlowerMenuStoreProps>
) => {
  // vanilla store
  return createStore<FlowerMenuStoreState>()((set, get) => ({
    ...defaultProps,
    ...props,

    initialise: () =>
      set((state) => {
        const nodes: Record<string, NodeState> = {};
        const selectedNodeIds: Record<string, string> = {};

        createNodes(simpleData, nodes);

        // set up the selected node ids
        Object.values(nodes).forEach((node) => {
          if (
            node.selectedChild >= 0 &&
            node.selectedChild < node.children.length
          ) {
            selectedNodeIds[node.id] = node.children[node.selectedChild];
          }
        });

        return { nodes, selectedNodeIds };
      }),

    getChildNodeIds: (nodeId?: string) => {
      return getChildNodeIds(get().nodes, nodeId);
    },
    getNodeState: (nodeId: string) => {
      const node = get().nodes[nodeId];
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }
      return node;
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

      if (selectedChild >= 0 && selectedChild < children.length) {
        return get().getNodeIcon(children[selectedChild]);
      }

      return undefined;
    },

    open: (nodeId: string) => {},

    handleNodeSelect: (nodeId: string) =>
      set((state) => {
        // log.debug('handleNodeSelect', nodeId);
        const nodeState = state.getNodeState(nodeId);

        if (!nodeState) {
          throw new Error(`Node ${nodeId} not found`);
        }

        const { selectedChild, children } = nodeState;

        // if the node has children, then toggle the isOpen status
        if (children.length > 0) {
          return {
            ...state,
            nodes: {
              ...state.nodes,
              [nodeId]: {
                ...nodeState,
                isOpen: !nodeState.isOpen
              }
            }
          };
        }

        // if the node does not have children, the fire an event
        else {
          nodeState.action = 'select';
        }

        return {
          ...state,
          nodes: {
            ...state.nodes,
            [nodeId]: {
              ...nodeState,
              selectedChild: (selectedChild + 1) % children.length
            }
          },
          selectedNodeIds: {
            ...state.selectedNodeId,
            [nodeId]: children[selectedChild]
          }
        };
      }),
    handleNodeLongPress: (nodeId: string) => {
      log.debug('handleNodeLongPress', nodeId);
    }
  }));
};
