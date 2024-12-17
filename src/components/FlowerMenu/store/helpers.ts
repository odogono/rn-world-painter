import { Dimensions, LayoutRectangle } from 'react-native';

import { withTiming } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { LayoutInsets, Rect2, Vector2 } from '@types';
import { Vector2WithLayout } from '../types';
import type { FlowerMenuStoreState } from './store';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const log = createLogger('FlowerMenuHelpers');

export const applyNodeState = (
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

export const openChildren = (
  state: FlowerMenuStoreState,
  nodeId: string,
  doAnimate: boolean = true
) => {
  const nodeState = state.nodes[nodeId];

  const { children: childIds, position } = nodeState;

  if (childIds.length <= 0) {
    return state;
  }

  const { x, y } = position.value;
  const radius = 70;

  const { startAngle, endAngle } = findAngleRange(
    state.viewLayout,
    state.insets,
    position.value,
    radius
  );

  const angleStep = (endAngle - startAngle) / (childIds.length - 1);

  // log.debug('angleStep', (angleStep * 180) / Math.PI);
  state = childIds.reduce((acc, childId, index) => {
    const childState = state.nodes[childId];
    if (childState) {
      const radians = startAngle + index * angleStep;
      const newPosition: Vector2 = {
        x: x + Math.cos(radians) * radius,
        y: y + Math.sin(radians) * radius
      };

      if (doAnimate) {
        // set initial position to parent
        childState.position.modify((p) => {
          'worklet';
          return { x, y };
        });

        // animate to new position
        childState.position.value = withTiming(newPosition, { duration: 200 });
      } else {
        childState.position.modify((p) => {
          'worklet';
          return newPosition;
        });
      }
    }

    return acc;
  }, state);

  state = applyNodeState(state, nodeId, 'isOpen', true);

  return state;
};

export const closeChildren = (state: FlowerMenuStoreState, nodeId: string) => {
  const duration = 200;
  const nodeState = state.nodes[nodeId];

  const { children: childIds, position } = nodeState;

  if (childIds.length <= 0) {
    return state;
  }

  const { x, y } = position.value;

  childIds.forEach((childId) => {
    const childState = state.nodes[childId];
    if (childState) {
      childState.position.value = withTiming({ x, y }, { duration });
    }
  });

  // close the node after the animations have done
  // because the state will probably be stale at that
  // point, we must use a timeout
  setTimeout(() => {
    state.events.emit('node:close:force', { id: nodeId });
  }, duration);

  return state;
};

export const enforceInsetBounds = (
  state: FlowerMenuStoreState,
  nodeId: string
) => {
  const { viewLayout, insets } = state;
  const bounds = {
    x: viewLayout.x + insets.left,
    y: viewLayout.y + insets.top,
    width: viewLayout.width - insets.left - insets.right,
    height: viewLayout.height - insets.top - insets.bottom
  };

  const nodeState = state.nodes[nodeId];
  const { position } = nodeState;
  const { x, y } = position.value;
  const target = { x, y };

  if (x < bounds.x) {
    target.x = bounds.x;
  }
  if (x + 59 > bounds.x + bounds.width) {
    target.x = bounds.x + bounds.width - 59;
  }
  if (y < bounds.y) {
    target.y = bounds.y;
  }
  if (y + 59 > bounds.y + bounds.height) {
    target.y = bounds.y + bounds.height - 59;
  }

  log.debug('[enforceInsetBounds]', target);

  position.value = withTiming(target, { duration: 200 });
};

export const findAngleRange = (
  viewLayout: LayoutRectangle,
  insets: LayoutInsets,
  position: Vector2,
  radius: number
) => {
  const bounds = {
    x: viewLayout.x + insets.left,
    y: viewLayout.y + insets.top,
    width: viewLayout.width - insets.left - insets.right,
    height: viewLayout.height - insets.top - insets.bottom
  };

  const isTop = isRectContained(bounds, {
    x: position.x + Math.cos(-Math.PI / 2) * radius,
    y: position.y + Math.sin(-Math.PI / 2) * radius,
    width: 59,
    height: 59
  });

  const isRight = isRectContained(bounds, {
    x: position.x + Math.cos(0) * radius,
    y: position.y + Math.sin(0) * radius,
    width: 59,
    height: 59
  });

  const isBottom = isRectContained(bounds, {
    x: position.x + Math.cos(Math.PI / 2) * radius,
    y: position.y + Math.sin(Math.PI / 2) * radius,
    width: 59,
    height: 59
  });

  const isLeft = isRectContained(bounds, {
    x: position.x + Math.cos(Math.PI) * radius,
    y: position.y + Math.sin(Math.PI) * radius,
    width: 59,
    height: 59
  });

  // log.debug('🌸 view bounds', bounds);
  // log.debug('🌸 isTop', isTop);
  // log.debug('🌸 isRight', isRight);
  // log.debug('🌸 isBottom', isBottom);
  // log.debug('🌸 isLeft', isLeft);

  // todo - get rid of hardcoding conditions

  // no intersection
  if (isTop && isRight && isBottom && isLeft) {
    return {
      startAngle: -Math.PI / 2,
      endAngle: Math.PI * 2 - Math.PI / 2 - 1
    };
  }

  // left edge
  if (isTop && isRight && isBottom) {
    return { startAngle: -(Math.PI / 2), endAngle: Math.PI / 2 };
  }

  // bottom edge
  if (isTop && isRight && isLeft) {
    return { startAngle: Math.PI, endAngle: Math.PI * 2 };
  }

  // top edge
  if (isBottom && isRight && isLeft) {
    return { startAngle: 0, endAngle: Math.PI };
  }

  // right edge
  if (isTop && isLeft && isBottom) {
    return { startAngle: Math.PI / 2, endAngle: Math.PI / 2 + Math.PI };
  }

  // top left
  if (isBottom && isRight) {
    return { startAngle: 0, endAngle: Math.PI / 2 };
  }

  // top right
  if (isBottom && isLeft) {
    return { startAngle: Math.PI / 2, endAngle: Math.PI };
  }

  // bottom right
  if (isTop && isLeft) {
    return { startAngle: 0, endAngle: Math.PI };
  }

  // bottom left
  if (isTop && isRight) {
    return { startAngle: -Math.PI / 2, endAngle: 0 };
  }

  return {
    startAngle: -Math.PI / 2,
    endAngle: Math.PI * 2 - Math.PI / 2 - 1
  };
};

export const isRectContained = (outer: Rect2, inner: Rect2) => {
  return (
    // Left edge check
    inner.x >= outer.x &&
    // Right edge check
    inner.x + inner.width <= outer.x + outer.width &&
    // Top edge check
    inner.y >= outer.y &&
    // Bottom edge check
    inner.y + inner.height <= outer.y + outer.height
  );
};

export const parseNodeKey = (input: string) => {
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
  // const formattedId = id.replace(/([A-Z])/g, (match, letter, offset) => {
  //   return offset > 0 ? letter.toLowerCase() : letter.toLowerCase();
  // });

  return {
    id,
    prop: formattedProp
  };
};

export const parseVector2WithLayout = (position?: Vector2WithLayout) => {
  if (!position) {
    return { x: -100, y: -100 };
  }

  const { x: inputX, y: inputY } = position;

  return {
    x: parseLayoutPosition(inputX),
    y: parseLayoutPosition(inputY)
  };
};

const directionPattern = /^(top|bottom|left|right|vcenter|hcenter)([\+\-]\d+)$/;
export const parseLayoutPosition = (input: string | number) => {
  if (typeof input === 'number') {
    return input;
  }

  const match = input.match(directionPattern);

  if (!match) {
    return 0;
  }

  const [_, direction, valueStr] = match;

  const value = parseInt(valueStr, 10);
  let result = 0;

  switch (direction) {
    case 'vcenter':
      result = windowHeight / 2 + value;
      break;
    case 'hcenter':
      result = windowWidth / 2 + value;
      break;
    case 'bottom':
      result = windowHeight + value;
      break;
    case 'right':
      result = windowWidth + value;
      break;
    default:
      result = value;
      break;
  }

  return result;
};
