import { useEffect } from 'react';
import { LayoutRectangle, StyleSheet, View } from 'react-native';

import { createLogger } from '@helpers/log';
import { FlowerNodeComponent } from './FlowerNodeComponent';
import { useMenuStore } from './store/context';

const log = createLogger('FlowerMenu');

export type FlowerMenuProps = {
  viewLayout: LayoutRectangle;
} & Partial<{
  [key: string]: any;
}>;

/**
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
  const setViewLayout = useMenuStore().use.setViewLayout();

  const nodePropStr = JSON.stringify(nodeProps);

  // when nodeProps from the parent change, apply them
  // to the menu store
  useEffect(() => {
    applyNodeProps(nodeProps);
  }, [nodePropStr]);

  useEffect(() => {
    if (viewLayout) {
      setViewLayout(viewLayout);
    }
  }, [viewLayout]);

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
