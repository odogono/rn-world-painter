import RBush from 'rbush';

import { BBox, Rect2, Vector2, WPFeature } from '@types';

// https://www.npmjs.com/package/@turf/geojson-rbush?activeTab=code

export class TileRBush extends RBush<WPFeature> {
  toBBox(feature: WPFeature) {
    let bbox: BBox | undefined;
    if (feature.bbox) {
      bbox = feature.bbox;
    } else {
      throw new Error('Feature has no bbox');
    }

    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    };
  }

  // compareMinX(a: WPFeature, b: WPFeature) {
  //   return a.position[0] - a.size / 2 - (b.position[0] - b.size / 2);
  // }
  // compareMinY(a: WPFeature, b: WPFeature) {
  //   return a.position[1] - a.size / 2 - (b.position[1] - b.size / 2);
  // }

  remove(tile: WPFeature) {
    return super.remove(tile, (a, b) => {
      return a.id === b.id;
    });
  }
}

export const createRTree = (): TileRBush => {
  return new TileRBush();
};

export const findByBBox = (rtree: TileRBush, bbox: BBox) => {
  const [minX, minY, maxX, maxY] = bbox;

  return rtree.search({
    minX,
    minY,
    maxX,
    maxY
  });
};

export const findByRect = (rtree: TileRBush, rect: Rect2) => {
  return rtree.search({
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  });
};

export const findByPosition = (rtree: TileRBush, position: Vector2) => {
  return rtree.search({
    minX: position.x,
    minY: position.y,
    maxX: position.x,
    maxY: position.y
  });
};
