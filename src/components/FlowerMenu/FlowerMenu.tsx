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

export type FlowerMenuProps = {
  viewLayout: LayoutRectangle;
} & Partial<{
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
export const FlowerMenu = ({ viewLayout, ...nodeProps }: FlowerMenuProps) => {
  const nodeIds = useMenuStore().use.getVisibleNodeIds()();

  // this is used to trigger a re-render when the nodes change
  // otherwise opening/closing parents does not trigger a re-render
  useMenuStore().use.nodes();

  const applyNodeProps = useMenuStore().use.applyNodeProps();
  // const applyNodeProps = useFlowerMenuStore((s) => s.applyNodeProps);
  const setViewLayout = useMenuStore().use.setViewLayout();
  // const setViewLayout = useFlowerMenuStore((s) => s.setViewLayout);

  const nodePropStr = JSON.stringify(nodeProps);

  useEffect(() => {
    applyNodeProps(nodeProps);
    // log.debug('applyNodeProps', nodeProps);
  }, [nodePropStr]);

  useEffect(() => {
    if (viewLayout) {
      setViewLayout(viewLayout);
    }
    // log.debug('viewLayout', viewLayout);
  }, [viewLayout]);

  // log.debug('FlowerMenu', nodeProps);
  // useEffect(() => {
  //   log.debug('nodeIds changed', nodeIds);
  //   // nodeIds.forEach((id) => {
  //   //   const selected = selectedNodeIds[id];
  //   //   log.debug(id, selected.children[selected.selectedChild]);
  //   // });
  // }, [nodeIds]);
  // useEffect(() => {
  //   log.debug('nodes changed', Object.keys(nodes));
  //   // nodeIds.forEach((id) => {
  //   //   const selected = selectedNodeIds[id];
  //   //   log.debug(id, selected.children[selected.selectedChild]);
  //   // });
  // }, [nodes]);

  // log.debug('rendered', nodeIds);
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
