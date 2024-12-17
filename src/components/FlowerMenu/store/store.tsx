import { Dimensions, LayoutRectangle } from 'react-native';

import mitt, { Emitter } from 'mitt';
import { makeMutable, withTiming } from 'react-native-reanimated';
import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createLogger } from '@helpers/log';
import { LayoutInsets, Rect2, Vector2 } from '@types';
import { Node, NodeState, Vector2WithLayout } from '../types';
import { menuData } from './data';
import type { FlowerMenuEvents } from './events';
import {
  FlowerMenuSpatialIndex,
  createSpatialIndex
} from './flowerMenuSpatialIndex';
import {
  applyNodeState,
  closeChildren,
  enforceInsetBounds,
  openChildren,
  parseNodeKey,
  parseVector2WithLayout
} from './helpers';
import { appStorage } from './persist';

const log = createLogger('FlowerMenuStore');

export interface FlowerMenuStoreProps {
  nodes: Record<string, NodeState>;
  spatialIndex: FlowerMenuSpatialIndex;
  viewLayout: LayoutRectangle;
  insets: LayoutInsets;
  events: Emitter<FlowerMenuEvents>;
}

const defaultProps: FlowerMenuStoreProps = {
  nodes: {},
  spatialIndex: createSpatialIndex(),
  viewLayout: { x: 0, y: 0, width: 0, height: 0 },
  insets: { left: 10, top: 100, right: 10, bottom: 50 },
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
  handleNodeDragStart: (nodeId: string) => void;
  handleNodeDragEnd: (nodeId: string) => void;
  getVisibleNodeIds: () => string[];

  applyNodeProps: (props: Record<string, any>) => void;
  setViewLayout: (layout: LayoutRectangle) => void;
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
          nodes: state.nodes
          // selectedNodeId: state.selectedNodeId
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

      createNodes(menuData, nodes);

      const result = { ...state, nodes };

      // ensure any children in an open state are positioned correctly
      // bit of a hack, but works for now
      setTimeout(() => {
        state.events.emit('view:layout');
      }, 50);

      return result;
    }),

  setViewLayout: (layout: LayoutRectangle) =>
    set((state) => ({ ...state, viewLayout: layout })),

  getChildNodeIds: (nodeId?: string) => {
    return getChildNodeIds(get().nodes, nodeId);
  },

  getVisibleNodeIds: () => {
    const nodes = get().nodes as Record<string, NodeState>;
    return Object.values(nodes)
      .filter((node) => {
        if (node.parentId) {
          return nodes[node.parentId].isOpen;
        }
        return true;
      })
      .map((node) => node.id);
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

      const { children } = nodeState;

      // if the node has children, then toggle the isOpen status
      if (children.length > 0) {
        if (!nodeState.isOpen) {
          return openChildren(state, nodeId);
        }

        return closeChildren(state, nodeId);
      }

      // const newState = { ...nodeState, isActive: !nodeState.isActive };
      // if the node does not have children, the fire an event
      get().events.emit('node:select', { id: nodeState.id });

      return state;
    }),

  handleNodeDragStart: (nodeId: string) =>
    set((state) => {
      const nodeState = state.getNodeState(nodeId);

      if (nodeState.isOpen) {
        return applyNodeState(state, nodeId, 'isOpen', false);
      }
      // determine whether the node has intersected with any other nodes
      // determine whether the node is within insets
      // enforceInsetBounds(state, nodeId);

      return state;
    }),
  handleNodeDragEnd: (nodeId: string) =>
    set((state) => {
      // determine whether the node has intersected with any other nodes
      // determine whether the node is within insets
      enforceInsetBounds(state, nodeId);

      return state;
    }),

  applyNodeProps: (props: Record<string, any>) =>
    set((state) => {
      let newState = state;
      Object.entries(props).forEach(([key, value]) => {
        const { id, prop } = parseNodeKey(key);
        log.debug('[applyNodeProps]', key, id, prop, value);

        newState = applyNodeState(newState, id, prop, value);
      });
      // log.debug('[applyNodeProps] newState', newState);
      return newState;
    }),

  handleNodeLongPress: (nodeId: string) => {
    log.debug('handleNodeLongPress', nodeId);
  }
});

const createNodeState = (node: Node, parentId?: string): NodeState => {
  return {
    id: node.id,
    name: node.name,
    icon: node.icon,
    action: node.action,
    position: makeMutable(parseVector2WithLayout(node.position)),
    selectedChild: (node.children?.length ?? 0) === 0 ? -1 : 0,
    children: node.children?.map((child) => child.id) ?? [],
    parentId,
    isOpen: node.isOpen ?? false,
    isActive: false,
    bounds: { x: 0, y: 0, width: 0, height: 0 }
  };
};

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

  // set the positions of any children in an open state
  Object.values(result).forEach((node) => {
    if (!node.parentId) {
      return;
    }
    const parent = result[node.parentId];
    if (parent.isOpen) {
      // node.position.value = withTiming(parent.position.value, { duration: 200 });
    }
  });

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
