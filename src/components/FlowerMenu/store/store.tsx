import mitt, { Emitter } from 'mitt';
import { makeMutable } from 'react-native-reanimated';
import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createLogger } from '@helpers/log';
import { LayoutInsets, Vector2 } from '@types';
import { Node, NodeState } from '../types';
import { data, simpleData } from './data';
import type { FlowerMenuEvents } from './events';
import {
  FlowerMenuSpatialIndex,
  createSpatialIndex
} from './flowerMenuSpatialIndex';
import { appStorage } from './persist';

const log = createLogger('FlowerMenuStore');

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
    action: node.action,
    position: makeMutable(node.position ?? { x: 10, y: 10 }),
    selectedChild: (node.children?.length ?? 0) === 0 ? -1 : 0,
    children: node.children?.map((child) => child.id) ?? [],
    parentId,
    isOpen: false,
    isActive: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 }
  };
};

export interface FlowerMenuStoreProps {
  nodes: Record<string, NodeState>;
  selectedNodeId: Record<string, string>;
  spatialIndex: FlowerMenuSpatialIndex;
  insets: LayoutInsets;
  events: Emitter<FlowerMenuEvents>;
}

const defaultProps: FlowerMenuStoreProps = {
  nodes: {},
  selectedNodeId: {},
  spatialIndex: createSpatialIndex(),
  insets: { left: 10, top: 50, right: 10, bottom: 50 },
  events: mitt<FlowerMenuEvents>()
};

export interface FlowerMenuStoreState extends FlowerMenuStoreProps {
  initialise: () => void;
  open: (nodeId: string) => void;

  getNodeState: (nodeId: string) => NodeState | undefined;
  getNodeIcon: (nodeId: string) => string | undefined;
  getChildNodeIds: (nodeId?: string) => string[];
  handleNodeSelect: (nodeId: string) => void;
  handleNodeLongPress: (nodeId: string) => void;

  applyNodeProps: (props: Record<string, any>) => void;
}

export type FlowerMenuStore = ReturnType<typeof createFlowerMenuStore>;

export const createFlowerMenuStore = (
  props?: Partial<FlowerMenuStoreProps>
) => {
  // vanilla store
  return createStore<FlowerMenuStoreState>()(
    persist(initialiser(props), {
      name: 'flowerMenu',
      storage: appStorage,
      partialize: (state) => {
        return {
          nodes: state.nodes,
          selectedNodeId: state.selectedNodeId
        };
      },
      merge: (persistedState, currentState) => {
        // todo - complete merging of state
        log.debug('merge persisted', persistedState);
        log.debug('merge current', currentState);
        return currentState;
      }
    })
  );
};

const initialiser = (props?: Partial<FlowerMenuStoreProps>) => (set, get) => ({
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

      // const newState = { ...nodeState, isActive: !nodeState.isActive };
      // if the node does not have children, the fire an event
      get().events.emit('node:select', { id: nodeState.id });

      return state;
    }),

  applyNodeProps: (props: Record<string, any>) =>
    set((state) => {
      let newState = state;
      Object.entries(props).forEach(([key, value]) => {
        const { id, prop } = parseNodeKey(key);
        log.debug('[applyNodeProps]', id, prop, value);

        newState = applyNodeState(newState, id, prop, value);
      });
      // log.debug('[applyNodeProps] newState', newState);
      return newState;
    }),

  handleNodeLongPress: (nodeId: string) => {
    log.debug('handleNodeLongPress', nodeId);
  }
});

const applyNodeState = (
  state: FlowerMenuStoreState,
  nodeId: string,
  prop: string,
  value: any
) => {
  const nodeState = state.nodes[nodeId];
  if (nodeState) {
    return {
      ...state,
      nodes: {
        ...state.nodes,
        [nodeId]: {
          ...nodeState,
          [prop]: value
        }
      }
    };
  }
  return state;
};

const parseNodeKey = (input: string) => {
  // Find the position of "Node" in the string
  const nodeIndex = input.indexOf('Node');
  if (nodeIndex === -1) {
    throw new Error('Invalid format: string must contain "Node"');
  }

  // Split the string into id and prop parts
  const id = input.slice(0, nodeIndex);
  const prop = input.slice(nodeIndex + 4); // +4 to skip "Node"

  // Convert first character of prop to lowercase
  const formattedProp = prop.charAt(0).toLowerCase() + prop.slice(1);

  // Convert camelCase id to separate words if needed
  const formattedId = id.replace(/([A-Z])/g, (match, letter, offset) => {
    return offset > 0 ? letter.toLowerCase() : letter.toLowerCase();
  });

  return {
    id: formattedId,
    prop: formattedProp
  };
};