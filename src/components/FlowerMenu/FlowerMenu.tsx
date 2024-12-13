import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { createLogger } from '@helpers/log';
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
  const nodeIds = useMenuStore().use.getChildNodeIds()();
  const selectedNodeIds = useFlowerMenuStore((s) => s.nodes);
  // const ns = useFlowerMenuStore((s) => s.nodes);

  useEffect(() => {
    nodeIds.forEach((id) => {
      const selected = selectedNodeIds[id];
      log.debug(
        'FlowerMenuContainer',
        id,
        selected.children[selected.selectedChild]
      );
    });
  }, [nodeIds, selectedNodeIds]);

  // log.debug('FlowerMenuContainer rendered', nodeIds);
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
