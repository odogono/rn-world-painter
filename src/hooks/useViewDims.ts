import { useState } from 'react';
import { LayoutRectangle } from 'react-native';

export const useViewDims = () => {
  const [viewDims, setViewDims] = useState<LayoutRectangle>({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  });

  const areViewDimsValid = viewDims.width !== 0 && viewDims.height !== 0;

  return { viewDims, setViewDims, areViewDimsValid };
};
