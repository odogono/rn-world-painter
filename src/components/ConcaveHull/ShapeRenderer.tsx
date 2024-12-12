import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Group, Path, SkPath, Skia } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { createLogger } from '@helpers/log';
import { useStore, useStoreState } from '@model/useStore';
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature } from '@types';

const log = createLogger('ShapeRenderer');

export const ShapeRenderer = () => {
  const visibleTileIdsRef = useRef<string>('');
  const [visibleFeatures, setVisibleFeatures] = useState<BrushFeature[]>([]);
  const { getVisibleFeatures } = useStoreActions();

  const [mViewMatrix, mViewPosition, mViewScale, mViewBBox, features] =
    useStoreState((state) => [
      state.mViewMatrix,
      state.mViewPosition,
      state.mViewScale,
      state.mViewBBox,
      state.features
    ]);

  useEffect(() => {
    setTimeout(() => {
      updateVisibleFeatures(mViewBBox.value);
    }, 1);
  }, [features]);

  const updateVisibleFeatures = useCallback((bbox: BBox) => {
    const visibleFeatures = getVisibleFeatures(bbox);

    const visibleIds = visibleFeatures
      .map((feature) => feature.id)
      .filter(Boolean)
      .join('|');

    if (visibleIds !== visibleTileIdsRef.current) {
      visibleTileIdsRef.current = visibleIds;
      setVisibleFeatures(visibleFeatures);
    }
  }, []);

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

const ShapeComponent = ({ shape }: { shape: BrushFeature }) => {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    applyBrushFeatureToPath(shape, p);
    return p;
  }, [shape]);

  return <Path path={path} color='#444' />;
};

const applyBrushFeatureToPath = (shape: BrushFeature, path: SkPath) => {
  const points = shape.geometry.coordinates[0];

  path.reset();
  path.moveTo(points[0][0], points[0][1]);
  for (let ii = 1; ii < points.length; ii++) {
    path.lineTo(points[ii][0], points[ii][1]);
  }
  path.close();

  return path;
};
