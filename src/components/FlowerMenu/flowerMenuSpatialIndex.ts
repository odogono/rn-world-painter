import RBush from 'rbush';

import { Rect2, Vector2 } from '@types';
import type { NodeState } from './types';

// https://www.npmjs.com/package/@turf/geojson-rbush?activeTab=code

export class FlowerMenuSpatialIndex extends RBush<NodeState> {
  toBBox(feature: NodeState) {
    const bbox = feature.bounds;

    const minX = bbox.x;
    const minY = bbox.y;
    const maxX = bbox.x + bbox.width;
    const maxY = bbox.y + bbox.height;

    return {
      minX,
      minY,
      maxX,
      maxY
    };
  }

  compareMinX(a: NodeState, b: NodeState) {
    return a.bounds.x - b.bounds.x;
  }
  compareMinY(a: NodeState, b: NodeState) {
    return a.bounds.y - b.bounds.y;
  }

  remove(tile: NodeState) {
    return super.remove(tile, (a, b) => {
      return a.id === b.id;
    });
  }

  findByBBox(bbox: Rect2) {
    const minX = bbox.x;
    const minY = bbox.y;
    const maxX = bbox.x + bbox.width;
    const maxY = bbox.y + bbox.height;

    return this.search({
      minX,
      minY,
      maxX,
      maxY
    });
  }

  findByIntersecting(feature: NodeState) {
    const bboxIntersections = this.findByBBox(feature.bounds);
    return bboxIntersections;
  }
}

export const createSpatialIndex = (): FlowerMenuSpatialIndex => {
  return new FlowerMenuSpatialIndex();
};

export const findByRect = (rtree: FlowerMenuSpatialIndex, rect: Rect2) => {
  return rtree.search({
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  });
};

export const findByPosition = (
  rtree: FlowerMenuSpatialIndex,
  position: Vector2
) => {
  return rtree.search({
    minX: position.x,
    minY: position.y,
    maxX: position.x,
    maxY: position.y
  });
};
