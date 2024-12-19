import { useMemo } from 'react';

import { Path, Rect, SkPath, Skia } from '@shopify/react-native-skia';

import { BrushFeature } from '@types';

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
