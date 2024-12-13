import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '../../helpers/log';
import { FlowerNodeComponent } from './FlowerNodeComponent';
import {
  FlowerMenuStoreProvider,
  useFlowerMenuStore,
  useMenuStore
} from './storeContext';

const { width, height } = Dimensions.get('window');

const log = createLogger('FlowerMenu');

/**
 * Single tap - cycle through children
 * Long tap - open children
 * Very long press - move mode (move to anywhere on screen)
 *
 *
 * @param param0
 * @returns
 */
export const FlowerMenu = ({
  isWorldMoveEnabled,
  onPress
}: {
  isWorldMoveEnabled: boolean;
  onPress: () => void;
}) => {
  return (
    <FlowerMenuStoreProvider>
      <FlowerMenuContainer />
    </FlowerMenuStoreProvider>
  );
};

const FlowerMenuContainer = () => {
  // const rootNodes = useFlowerMenuStore((s) => s.rootNodes);
  const initialise = useFlowerMenuStore((s) => s.initialise);
  const nodeIds = useMenuStore().use.getChildNodeIds()();

  useEffect(() => {
    log.debug('FlowerMenuContainer');
    initialise();
  }, []);

  return (
    <View style={styles.container}>
      {nodeIds.map((id) => (
        <FlowerNodeComponent key={id} nodeId={id} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute'
  }
});
