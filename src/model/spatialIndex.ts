import RBush from 'rbush';

import { booleanDisjoint } from '@turf/boolean-disjoint';
import { BBox, BrushFeature, Rect2, Vector2 } from '@types';

// https://www.npmjs.com/package/@turf/geojson-rbush?activeTab=code

export class FeatureRBush extends RBush<BrushFeature> {
  toBBox(feature: BrushFeature) {
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

  compareMinX(a: BrushFeature, b: BrushFeature) {
    return a.bbox![0] - b.bbox![0];
  }
  compareMinY(a: BrushFeature, b: BrushFeature) {
    return a.bbox![1] - b.bbox![1];
  }

  remove(tile: BrushFeature) {
    return super.remove(tile, (a, b) => {
      return a.id === b.id;
    });
  }

  findByBBox(bbox: BBox) {
    const [minX, minY, maxX, maxY] = bbox;

    return this.search({
      minX,
      minY,
      maxX,
      maxY
    });
  }

  findByIntersecting(feature: BrushFeature) {
    const bboxIntersections = this.findByBBox(feature.bbox!);

    // const intersectingFeatures = bboxIntersections.filter(
    //   (intersectingFeature) => {
    //     return booleanDisjoint(feature, intersectingFeature);
    //   }
    // );

    // console.log(
    //   '[findByIntersecting] intersectingFeatures',
    //   intersectingFeatures.length,
    //   'bboxIntersections',
    //   bboxIntersections.length
    // );

    return bboxIntersections;
  }
}

export const createSpatialIndex = (): FeatureRBush => {
  return new FeatureRBush();
};

export const findByRect = (rtree: FeatureRBush, rect: Rect2) => {
  return rtree.search({
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  });
};

export const findByPosition = (rtree: FeatureRBush, position: Vector2) => {
  return rtree.search({
    minX: position.x,
    minY: position.y,
    maxX: position.x,
    maxY: position.y
  });
};
