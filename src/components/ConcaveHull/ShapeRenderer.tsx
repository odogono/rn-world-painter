import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Group, Path, Rect, SkPath, Skia } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStoreState } from '@model/useStore';
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature } from '@types';
import { setDebugMsg3, setDebugMsg4, setDebugMsg5 } from '../Debug/Debug';

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

export const ShapeComponent = ({ shape }: { shape: BrushFeature }) => {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    applyBrushFeatureToPath(shape, p);
    return p;
  }, [shape]);

  const isSelected = shape.properties.isSelected;
  const bbox = useMemo(() => {
    return isSelected ? path.computeTightBounds() : null;
  }, [isSelected, path]);

  const color = shape.properties.color ?? '#444';

  return (
    <>
      <Path path={path} color={color} style='stroke' strokeWidth={1} />
      {bbox && <Rect rect={bbox} style='stroke' strokeWidth={2} color='blue' />}
    </>
  );
};

const applyBrushFeatureToPath = (shape: BrushFeature, path: SkPath) => {
  const coordinates = shape.geometry.coordinates;
  for (let pp = 0; pp < coordinates.length; pp++) {
    const points = coordinates[pp];
    path.moveTo(points[0][0], points[0][1]);
    for (let ii = 1; ii < points.length; ii++) {
      path.lineTo(points[ii][0], points[ii][1]);
    }
    path.close();
  }

  return path;
};
