import { useEffect } from 'react';
import { Dimensions, LayoutRectangle, StyleSheet, View } from 'react-native';

import { createLogger } from '@helpers/log';
import type { LayoutInsets } from '@types';
import { FlowerNodeComponent } from './FlowerNodeComponent';
import {
  FlowerMenuStoreProvider,
  useFlowerMenuStore,
  useMenuStore
} from './store/context';

const log = createLogger('FlowerMenu');

export type FlowerMenuProps = Partial<{
  [key: string]: any;
  // isWorldMoveEnabled: boolean;
  // onPress: () => void;
}>;

/**
 * Single tap - cycle through children
 * Long tap - open children
 * Very long press - move mode (move to anywhere on screen)
 *
 *
 * @param param0
 * @returns
 */
export const FlowerMenu = ({ ...nodeProps }: FlowerMenuProps) => {
  const nodeIds = useMenuStore().use.getChildNodeIds()();
  const selectedNodeIds = useFlowerMenuStore((s) => s.nodes);
  const applyNodeProps = useFlowerMenuStore((s) => s.applyNodeProps);

  const nodePropStr = JSON.stringify(nodeProps);

  useEffect(() => {
    applyNodeProps(nodeProps);
    log.debug('applyNodeProps', nodeProps);
  }, [nodePropStr]);

  log.debug('FlowerMenu', nodeProps);
  useEffect(() => {
    // nodeIds.forEach((id) => {
    //   const selected = selectedNodeIds[id];
    //   log.debug(id, selected.children[selected.selectedChild]);
    // });
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
