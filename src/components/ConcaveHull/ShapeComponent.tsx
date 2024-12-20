import { useMemo } from 'react';

import { Path, Rect, SkPath, Skia } from '@shopify/react-native-skia';

import { BrushFeature } from '@types';

export type ShapeComponentProps = {
  shape: BrushFeature;
  selectionColor?: string;
  isFilled?: boolean;
};

export const ShapeComponent = ({
  shape,
  selectionColor = 'blue',
  isFilled = true
}: ShapeComponentProps) => {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    applyBrushFeatureToPath(shape, p);
    return p;
  }, [shape]);

  const isSelected = shape.properties.isSelected;
  const bbox = useMemo(() => {
    return isSelected ? path.computeTightBounds() : null;
  }, [isSelected, path]);

  const color = shape.properties.color ?? '#0061fd';

  const style = isFilled ? 'fill' : 'stroke';

  return (
    <>
      <Path path={path} color={color} style={style} strokeWidth={1} />
      {bbox && (
        <Rect
          rect={bbox}
          style='stroke'
          strokeWidth={2}
          color={selectionColor}
        />
      )}
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
