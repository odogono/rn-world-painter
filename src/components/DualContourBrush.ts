import { useCallback } from 'react';
import { LayoutRectangle } from 'react-native';

import { Canvas, Path, SkPoint, Skia } from '@shopify/react-native-skia';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { createLog } from '@helpers/log';

const log = createLog('DualContourBrush');

type BrushPoint = {
  x: number;
  y: number;
  radius: number;
};

export type Vertex = {
  x: number;
  y: number;
  normal: { x: number; y: number };
};

export type Edge = {
  vertex: number;
  intersections: {
    point: { x: number; y: number };
    normal: { x: number; y: number };
  }[];
};

export type SDF = {
  distance: number;
  normal: { x: number; y: number };
};

export const GRID_SIZE = 8; // Size of each cell in the grid

export type QEFData = {
  sum: { x: number; y: number };
  count: number;
  normal: { x: number; y: number };
};

const createQEFData = () => {
  'worklet';
  return {
    sum: { x: 0, y: 0 },
    count: 0,
    normal: { x: 0, y: 0 }
  };
};

const addQEFData = (
  qef: QEFData,
  point: { x: number; y: number },
  normal: { x: number; y: number }
) => {
  'worklet';
  qef.sum.x += point.x;
  qef.sum.y += point.y;
  qef.normal.x += normal.x;
  qef.normal.y += normal.y;
  qef.count++;
  return qef;
};

const solveQEFData = (qef: QEFData) => {
  'worklet';
  if (qef.count === 0) return null;
  return {
    x: qef.sum.x / qef.count,
    y: qef.sum.y / qef.count,
    normal: { x: qef.normal.x / qef.count, y: qef.normal.y / qef.count }
  };
};

// // Represents a point in 2D space with a normal
// class QEFData {
//   sum: { x: number; y: number };
//   count: number;
//   normal: { x: number; y: number };

//   constructor() {
//     this.sum = { x: 0, y: 0 };
//     this.count = 0;
//     this.normal = { x: 0, y: 0 };
//   }

//   add(point: { x: number; y: number }, normal: { x: number; y: number }) {
//     this.sum.x += point.x;
//     this.sum.y += point.y;
//     this.normal.x += normal.x;
//     this.normal.y += normal.y;
//     this.count++;
//   }

//   // Minimize the quadratic error function to find optimal vertex position
//   solve() {
//     if (this.count === 0) return null;
//     return {
//       x: this.sum.x / this.count,
//       y: this.sum.y / this.count,
//       normal: {
//         x: this.normal.x / this.count,
//         y: this.normal.y / this.count
//       }
//     };
//   }
// }

// Calculate signed distance field (SDF) for a point
const calculateSDF = (x: number, y: number, brushPoints: BrushPoint[]): SDF => {
  'worklet';

  let minDist = Infinity;
  let closestNormal = { x: 0, y: 0 };

  brushPoints.forEach((point) => {
    const dx = x - point.x;
    const dy = y - point.y;
    const dist = Math.sqrt(dx * dx + dy * dy) - point.radius;

    if (dist < minDist) {
      minDist = dist;
      // Calculate normal at this point
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        closestNormal = {
          x: dx / len,
          y: dy / len
        };
      }
    }
  });

  return { distance: minDist, normal: closestNormal };
};

// Find intersection points along grid edges
const findIntersections = (grid: SDF[][], x: number, y: number) => {
  'worklet';

  const intersections = [];
  const cell = grid[y][x];

  // Check horizontal edge
  if (y < grid.length - 1) {
    const nextCell = grid[y + 1][x];
    if (cell.distance * nextCell.distance < 0) {
      const t = cell.distance / (cell.distance - nextCell.distance);
      const point = {
        x: x * GRID_SIZE,
        y: (y + t) * GRID_SIZE
      };
      const normal = {
        x: (cell.normal.x + nextCell.normal.x) / 2,
        y: (cell.normal.y + nextCell.normal.y) / 2
      };
      intersections.push({ point, normal });
    }
  }

  // Check vertical edge
  if (x < grid[0].length - 1) {
    const nextCell = grid[y][x + 1];
    if (cell.distance * nextCell.distance < 0) {
      const t = cell.distance / (cell.distance - nextCell.distance);
      const point = {
        x: (x + t) * GRID_SIZE,
        y: y * GRID_SIZE
      };
      const normal = {
        x: (cell.normal.x + nextCell.normal.x) / 2,
        y: (cell.normal.y + nextCell.normal.y) / 2
      };
      intersections.push({ point, normal });
    }
  }

  return intersections;
};

// Determine if two edges should be connected based on shared intersection points
export const areEdgesConnected = (
  edge1: Edge,
  edge2: Edge,
  vertices: Vertex[]
) => {
  'worklet';

  const DISTANCE_THRESHOLD = GRID_SIZE * 2.5;
  const vertex1: Vertex = vertices[edge1.vertex];
  const vertex2: Vertex = vertices[edge2.vertex];

  // Check if vertices are close enough
  const dx = vertex1.x - vertex2.x;
  const dy = vertex1.y - vertex2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > DISTANCE_THRESHOLD) {
    return false;
  }

  // runOnJS(log.debug)('[areEdgesConnected] vertex1', vertex1);
  // runOnJS(log.debug)('[areEdgesConnected] vertex2', vertex2);
  // runOnJS(log.debug)('[areEdgesConnected] edge1', edge1);
  // runOnJS(log.debug)('[areEdgesConnected] edge2', edge2);

  // Check if edges share any intersection points (within a tolerance)
  const INTERSECTION_THRESHOLD = GRID_SIZE;
  for (const int1 of edge1.intersections) {
    for (const int2 of edge2.intersections) {
      const ix = int1.point.x - int2.point.x;
      const iy = int1.point.y - int2.point.y;
      const intersectionDistance = Math.sqrt(ix * ix + iy * iy);

      if (intersectionDistance < INTERSECTION_THRESHOLD) {
        return true;

        // // Check if normals are roughly aligned
        // const dotProduct =
        //   int1.normal.x * int2.normal.x + int1.normal.y * int2.normal.y;

        // runOnJS(log.debug)('[areEdgesConnected] dotProduct', dotProduct);

        // if (dotProduct > 0.7) {
        //   // cos(45°) ≈ 0.7
        //   return true;
        // }
      }
    }
  }

  return false;
};

// Generate vertices using QEF minimization
const generateVertices = (grid: SDF[][]) => {
  'worklet';

  const vertices: any[] = [];
  const edges: any[] = [];

  runOnJS(log.debug)('[generateVertices] grid', grid.length, grid[0]?.length);

  for (let y = 0; y < grid.length - 1; y++) {
    for (let x = 0; x < grid[0].length - 1; x++) {
      const qef = createQEFData();
      const intersections = findIntersections(grid, x, y);

      // runOnJS(log.debug)(
      //   '[generateVertices] found',
      //   intersections.length,
      //   'intersections'
      // );

      intersections.forEach(({ point, normal }) => {
        addQEFData(qef, point, normal);
      });

      if (intersections.length > 0) {
        const vertex = solveQEFData(qef);
        if (vertex) {
          vertices.push(vertex);
          // Store edge information for later connection
          if (intersections.length >= 2) {
            edges.push({
              vertex: vertices.length - 1,
              intersections
            });
          }
        }
      }
    }
  }

  return { vertices, edges };
};

// Connect vertices to form contours
// const generateContours = (vertices: any, edges: any) => {
//   'worklet';

//   const contours: any[] = [];
//   const used = new Set();

//   edges.forEach((edge: any) => {
//     if (!used.has(edge.vertex)) {
//       const contour = [edge.vertex];
//       used.add(edge.vertex);

//       let current = edge;
//       let found = true;

//       while (found) {
//         found = false;
//         for (const nextEdge of edges) {
//           const hasIt = !used.has(nextEdge.vertex);
//           const isConnected = areEdgesConnected(current, nextEdge, vertices);
//           // runOnJS(log.debug)('[generateContours] nextEdge', nextEdge);
//           // runOnJS(log.debug)('[generateContours] hasIt', hasIt);
//           // runOnJS(log.debug)('[generateContours] isConnected', isConnected);

//           if (hasIt && isConnected) {
//             contour.push(nextEdge.vertex);
//             used.add(nextEdge.vertex);
//             current = nextEdge;
//             found = true;
//             break;
//           }
//         }
//       }

//       runOnJS(log.debug)('[generateContours] contour', contour.length);

//       if (contour.length > 2) {
//         contours.push(contour.map((idx) => vertices[idx]));
//       }
//     }
//   });

//   return contours;
// };

const generateContours = (vertices: Vertex[], edges: Edge[]) => {
  'worklet';

  const contours: any[] = [];
  const used = new Set();

  runOnJS(log.debug)(
    `[generateContours] Starting contour generation with ${edges.length} edges`
  );

  // Sort edges by x coordinate to ensure consistent starting points
  edges.sort((a, b) => vertices[a.vertex].x - vertices[b.vertex].x);

  edges.forEach((startEdge) => {
    if (!used.has(startEdge.vertex)) {
      const contour = [startEdge.vertex];
      used.add(startEdge.vertex);

      let currentEdge = startEdge;
      let attempts = 0;
      const MAX_ATTEMPTS = edges.length * 2; // Prevent infinite loops

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        let foundNext = false;

        // Find closest unused edge
        let closestEdge = null;
        let minDistance = Infinity;

        for (const nextEdge of edges) {
          if (
            !used.has(nextEdge.vertex) &&
            areEdgesConnected(currentEdge, nextEdge, vertices)
          ) {
            const v1 = vertices[currentEdge.vertex];
            const v2 = vertices[nextEdge.vertex];
            const dist = Math.sqrt(
              Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2)
            );

            runOnJS(log.debug)(
              `[generateContours] dist ${dist} minDistance ${minDistance}`
            );

            if (dist < minDistance) {
              minDistance = dist;
              closestEdge = nextEdge;
              foundNext = true;
            }
          }
        }

        if (foundNext && closestEdge) {
          contour.push(closestEdge.vertex);
          used.add(closestEdge.vertex);
          currentEdge = closestEdge;

          runOnJS(log.debug)(
            `[generateContours] contour length ${contour.length}`
          );
        } else {
          runOnJS(log.debug)(
            `[generateContours] contour length ${contour.length} not found`
          );
          break;
        }
      }

      if (contour.length > 2) {
        // Close the contour if endpoints are close enough
        const start = vertices[contour[0]];
        const end = vertices[contour[contour.length - 1]];
        const dist = Math.sqrt(
          Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)
        );

        if (dist < GRID_SIZE * 2) {
          contours.push(contour.map((idx) => vertices[idx]));
          log.debug(`Generated contour with ${contour.length} vertices`);
        }
      }
    }
  });

  runOnJS(log.debug)(
    `[generateContours] Generated ${contours.length} contours`
  );
  return contours;
};

// Convert contours to SVG path
const contoursToSVG = (contours: any) => {
  'worklet';

  let svgPath = '';

  contours.forEach((contour: any, i: number) => {
    svgPath += i === 0 ? 'M ' : ' M ';
    contour.forEach((point: any, j: number) => {
      if (j === 0) {
        svgPath += `${point.x},${point.y}`;
      } else {
        // Use cubic bezier curves for smoother results
        const prev = contour[(j - 1 + contour.length) % contour.length];
        const next = contour[(j + 1) % contour.length];
        const tangent = {
          x: next.x - prev.x,
          y: next.y - prev.y
        };
        const len = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y);
        if (len > 0) {
          tangent.x /= len;
          tangent.y /= len;
        }
        svgPath += ` C ${prev.x + (tangent.x * GRID_SIZE) / 2},${prev.y + (tangent.y * GRID_SIZE) / 2} ${
          point.x - (tangent.x * GRID_SIZE) / 2
        },${point.y - (tangent.y * GRID_SIZE) / 2} ${point.x},${point.y}`;
      }
    });
    svgPath += ' Z';
  });

  return svgPath;
};

const generateSVG = (
  points: BrushPoint[],
  { width, height }: LayoutRectangle
) => {
  'worklet';

  runOnJS(log.debug)('[generateSVG] points count', points.length);

  // Create grid and calculate SDF for each cell
  const grid = Array(Math.ceil(height / GRID_SIZE))
    .fill(0)
    .map((_, y) =>
      Array(Math.ceil(width / GRID_SIZE))
        .fill(0)
        .map((_, x) => calculateSDF(x * GRID_SIZE, y * GRID_SIZE, points))
    );

  // runOnJS(log.debug)(
  //   '[generateSVG] grid',
  //   { width, height },
  //   grid.length,
  //   Math.ceil(height / GRID_SIZE)
  // );

  // Generate vertices and edges
  const { vertices, edges } = generateVertices(grid);

  runOnJS(log.debug)('[generateSVG] edges', edges);

  // Generate contours from vertices
  const contours = generateContours(vertices, edges);

  runOnJS(log.debug)('[generateSVG] contours', contours);

  // Convert to SVG path
  return contoursToSVG(contours);
};

export const useDualContourBrush = (viewDims: LayoutRectangle) => {
  const points = useSharedValue<BrushPoint[]>([]);
  const brushSize = useSharedValue(20);
  const svgPath = useSharedValue<string>('??');

  const addPoint = useCallback(
    (point: SkPoint) => {
      'worklet';
      points.value = [...points.value, { ...point, radius: brushSize.value }];
    },
    [points, brushSize]
  );

  const endBrush = useCallback(() => {
    'worklet';
    svgPath.value = generateSVG(points.value, viewDims);

    runOnJS(log.debug)('[endBrush]', svgPath.value);
    points.value = [];
  }, [points, viewDims, brushSize]);

  return { addPoint, endBrush, points, brushSize, svgPath };
};
