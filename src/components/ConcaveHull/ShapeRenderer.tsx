import { useCallback, useEffect, useRef, useState } from 'react';

import { Group } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStoreState } from '@model/useStore';
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature } from '@types';
import { setDebugMsg3, setDebugMsg4 } from '../Debug/Debug';
import { ShapeComponent } from './ShapeComponent';

const log = createLogger('ShapeRenderer');

export const ShapeRenderer = () => {
  const visibleTileIdsRef = useRef<string>('');
  const [visibleFeatures, setVisibleFeatures] = useState<BrushFeature[]>([]);
  const { getVisibleFeatures } = useStoreActions();
  const selectedFeatures = useStoreState().use.selectedFeatures();
  const features = useStoreState().use.features();
  const mViewBBox = useStoreState().use.mViewBBox();

  useEffect(() => {
    setTimeout(() => {
      updateVisibleFeatures(mViewBBox.value);
    }, 1);
  }, [features]);

  const updateVisibleFeatures = useCallback(
    (bbox: BBox) => {
      const visibleFeatures = getVisibleFeatures(bbox).map((feature) => {
        const isSelected = selectedFeatures.includes(feature.id as string);
        return {
          ...feature,
          properties: { ...feature.properties, isSelected }
        };
      });

      const visibleIds = visibleFeatures
        .map((feature) => {
          const isSelected = feature.properties.isSelected;
          return (
            feature.id +
            ',' +
            JSON.stringify(feature.bbox) +
            ',' +
            (isSelected ? 'S' : '')
          );
        })
        .filter(Boolean)
        .join('|');

      // log.debug('[updateVisibleFeatures] visibleIds', visibleIds);

      if (visibleIds !== visibleTileIdsRef.current) {
        visibleTileIdsRef.current = visibleIds;
        setVisibleFeatures(visibleFeatures);
        setDebugMsg3(`visibleFeatures: ${visibleFeatures.length}`);
        setDebugMsg4(`selectedFeatures: ${selectedFeatures}`);
      }
    },
    [selectedFeatures]
  );

  useAnimatedReaction(
    () => [mViewBBox.value] as [BBox],
    ([bbox]) => {
      runOnJS(updateVisibleFeatures)(bbox);
    }
  );

  return (
    <Group>
      {visibleFeatures.map((shape) => (
        <ShapeComponent key={shape.id} shape={shape} />
      ))}
    </Group>
  );
};
