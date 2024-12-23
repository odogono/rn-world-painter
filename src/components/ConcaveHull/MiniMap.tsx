import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutRectangle } from 'react-native';

import { Group, Path, Rect, SkPath, Skia } from '@shopify/react-native-skia';
import {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { createLog } from '@helpers/log';
import {
  useStore,
  useStoreSelector,
  useStoreState,
  useStoreViewLayout
} from '@model/useStore';
import { useStoreActions } from '@model/useStoreActions';
import { BBox, BrushFeature } from '@types';
import { bboxToLayoutRectangle } from '../../helpers/geo';

const log = createLog('ShapeRenderer');

export const MiniMap = () => {
  const viewportPath = useSharedValue(Skia.Path.Make());

  const viewLayout = useStoreViewLayout();

  // const visibleTileIdsRef = useRef<string>('');
  // const [visibleFeatures, setVisibleFeatures] = useState<BrushFeature[]>([]);
  // const { getVisibleFeatures } = useStoreActions();
  const features = useStoreState().use.features();
  const mViewBBox = useStoreState().use.mViewBBox();

  useEffect(() => {
    runOnUI(updateViewportPath)();
  }, [features]);

  const updateViewportPath = useCallback(() => {
    'worklet';
    const [minX, minY, maxX, maxY] = mViewBBox.value;
    const layoutRectangle = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    viewportPath.modify((p) => {
      p.reset();
      p.addRect(layoutRectangle);
      return p;
    });
  }, []);

  useAnimatedReaction(
    () => mViewBBox.value,
    (bbox) => {
      updateViewportPath();
    }
  );

  const groupMatrix = useDerivedValue(() => {
    const { width, height } = viewLayout;
    const m = Skia.Matrix();
    m.translate(width - width / 6, height / 6);
    m.scale(0.2, 0.2);
    return m;
  });

  return (
    <>
      <Group matrix={groupMatrix}>
        <Guidelines viewLayout={viewLayout} />
        <Path path={viewportPath} strokeWidth={1} style='stroke' color='#F00' />
        {features.map((shape) => (
          <ShapeComponent key={shape.id} shape={shape} />
        ))}
      </Group>
      {/* <Guidelines viewLayout={viewLayout} /> */}
    </>
  );
};

export const Guidelines = ({ viewLayout }: { viewLayout: LayoutRectangle }) => (
  <>
    <Rect
      x={0}
      y={viewLayout.height / 2}
      width={viewLayout.width}
      height={0.5}
      color='#999'
    />
    <Rect
      x={viewLayout.width / 2}
      y={0}
      width={0.5}
      height={viewLayout.height}
      color='#999'
    />
  </>
);

const ShapeComponent = ({ shape }: { shape: BrushFeature }) => {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    applyBrushFeatureToPath(shape, p);
    return p;
  }, [shape]);

  return <Path path={path} strokeWidth={1} style='stroke' color='#444' />;
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
