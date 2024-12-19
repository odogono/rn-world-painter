import { StyleSheet } from 'react-native';

import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Icon, IconName } from '@components/Icon';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getContrastColor } from '@helpers/color';
import { createLogger } from '@helpers/log';
import { useFlowerMenuNode, useMenuStore } from './store/context';
import { useFlowerNodeGestures } from './useFlowerNodeGestures';

const log = createLogger('FlowerNodeComponent');

export type FlowerNodeComponentProps = {
  nodeId: string;
};

const WIDTH = 56;
const HEIGHT = 56;

/**
 * Single tap - cycle through children
 * Long tap - open children
 * Very long press - move mode (move to anywhere on screen)
 *
 *
 * @param param0
 * @returns
 */
export const FlowerNodeComponent = ({ nodeId }: FlowerNodeComponentProps) => {
  const node = useFlowerMenuNode(nodeId);

  const nodeIcon = useMenuStore().use.getNodeIcon()(nodeId) ?? 'question-mark';
  const handleNodeTap = useMenuStore().use.handleNodeSelect();
  const handleNodeDragStart = useMenuStore().use.handleNodeDragStart();
  const handleNodeDragEnd = useMenuStore().use.handleNodeDragEnd();
  const isGroup = node.children?.length > 0;
  const isChild = node.parentId !== undefined;
  const nodeColor = node.isActive ? '#c2c2c2' : (node.color ?? '#FFFFFF');
  const iconColor = getContrastColor(nodeColor);

  const gesture = useFlowerNodeGestures({
    handleNodeTap,
    handleNodeDragStart,
    handleNodeDragEnd,
    node
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      // transform: [{ scale: getNodeState(node.id)?.isOpen ? 1 : 0.5 }]
      transform: [
        { scale: 1 },
        { translateX: node.position.value.x },
        { translateY: node.position.value.y }
      ]
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.modeButton,
          animatedStyle,
          isGroup ? styles.groupButton : {},
          nodeColor ? { backgroundColor: nodeColor } : {},
          isChild ? styles.isChild : {}
        ]}
      >
        <Icon name={nodeIcon as IconName} size={24} color={iconColor} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  modeButton: {
    position: 'absolute',
    // bottom: 32,
    // right: 32,
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  groupButton: {
    borderWidth: 1,
    borderColor: 'black',
    borderStyle: 'dashed',
    zIndex: 2
  },
  isChild: {
    zIndex: 1
  }
});
