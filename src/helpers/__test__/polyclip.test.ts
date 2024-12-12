import { Feature, Polygon } from 'geojson';
import * as polyclip from 'polyclip-ts';

import { BrushFeature } from '../../types';
import { applyFeatureDifference } from '../polyclip';

describe('polyclip', () => {
  it('should work', () => {
    const poly1: polyclip.Geom = [
      [
        [0, 0],
        [5, 0],
        [5, 5],
        [0, 5],
        [0, 5]
      ]
    ];
    const poly2: polyclip.Geom = [
      [
        [2, 2],
        [7, 2],
        [7, 7],
        [2, 7],
        [2, 2]
      ]
    ];

    const result = polyclip.difference(poly1, poly2);

    expect(result).toEqual([
      [
        [
          [0, 0],
          [5, 0],
          [5, 2],
          [2, 2],
          [2, 5],
          [0, 5],
          [0, 0]
        ]
      ]
    ]);

    expect(true).toBe(true);
  });

  // Poly [[[number, number]]]

  it('should work with two non intersecting polygons', () => {
    const poly1: polyclip.Geom = [
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [0, 0]
      ]
    ];
    const poly2: polyclip.Geom = [
      [
        [10, 10],
        [10, 20],
        [20, 20],
        [20, 10],
        [10, 10]
      ]
    ];

    const result = polyclip.difference(poly1, poly2);

    // output is a multi polygon
    expect(result).toEqual([poly1]);
  });

  it('should return difference on two features', () => {
    const featureA: BrushFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-5, -1],
            [10, -1],
            [10, 1],
            [-5, 1],
            [-5, -1]
          ]
        ]
      },
      properties: {
        position: { x: 0, y: 0 },
        color: 'red'
      }
    };

    const featureB: BrushFeature = {
      type: 'Feature',
      properties: {
        position: { x: 0, y: 0 },
        color: 'red'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1, -5],
            [1, -5],
            [1, 5],
            [-1, 5],
            [-1, -5]
          ]
        ]
      }
    };

    const result = applyFeatureDifference(featureA, featureB);

    console.log(JSON.stringify(result, null, 2));
  });
});
