import { LayoutRectangle } from 'react-native';

import { withTiming } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { LayoutInsets, Rect2, Vector2 } from '@types';
import type { FlowerMenuStoreState } from './store';

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

export const applyChildPositions = (
  state: FlowerMenuStoreState,
  nodeId: string
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

  log.debug(
    'startAngle',
    (startAngle * 180) / Math.PI,
    'endAngle',
    (endAngle * 180) / Math.PI
  );

  const angleStep = (endAngle - startAngle) / (childIds.length - 1);

  log.debug('angleStep', (angleStep * 180) / Math.PI);
  state = childIds.reduce((acc, childId, index) => {
    const childState = state.nodes[childId];
    if (childState) {
      const radians = startAngle + index * angleStep;
      const newPosition: Vector2 = {
        x: x + Math.cos(radians) * radius,
        y: y + Math.sin(radians) * radius
      };

      childState.position.modify((p) => {
        'worklet';
        return { x, y };
      });

      childState.position.value = withTiming(newPosition, { duration: 200 });
    }

    return acc;
  }, state);

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
  const formattedId = id.replace(/([A-Z])/g, (match, letter, offset) => {
    return offset > 0 ? letter.toLowerCase() : letter.toLowerCase();
  });

  return {
    id: formattedId,
    prop: formattedProp
  };
};
