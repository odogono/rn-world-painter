import { Edge, Vertex, areEdgesConnected } from '../DualContourBrush';

type Point = { x: number; y: number };
type Normal = Point;

const makePoint = (x: number, y: number): Point => ({ x, y });
const makeNormal = (x: number, y: number): Normal => ({ x, y });

const makeVertex = (x: number, y: number): Vertex => ({
  x,
  y,
  normal: makeNormal(0, 0)
});

const makeIntersection = (point: Point, normal: Normal) => ({
  point,
  normal
});

const makeEdge = (
  vertexIndex: number,
  intersections: ReturnType<typeof makeIntersection>[]
): Edge => ({
  vertex: vertexIndex,
  intersections
});

const makeSingleIntersectionEdge = (
  vertexIndex: number,
  point: Point,
  normal: Normal
): Edge => makeEdge(vertexIndex, [makeIntersection(point, normal)]);

describe('areEdgesConnected', () => {
  describe('when edges share intersection points and have aligned normals', () => {
    const vertices = [makeVertex(0, 0), makeVertex(10, 10)];
    const sharedPoint = makePoint(5, 5);
    const sharedNormal = makeNormal(1, 0);

    const edge1 = makeSingleIntersectionEdge(0, sharedPoint, sharedNormal);
    const edge2 = makeSingleIntersectionEdge(1, sharedPoint, sharedNormal);

    it('should return true', () => {
      expect(areEdgesConnected(edge1, edge2, vertices)).toBe(true);
    });
  });

  describe('when edges are too far apart', () => {
    const vertices = [makeVertex(0, 0), makeVertex(100, 100)];
    const normal = makeNormal(1, 0);

    const edge1 = makeSingleIntersectionEdge(0, makePoint(5, 5), normal);
    const edge2 = makeSingleIntersectionEdge(1, makePoint(95, 95), normal);

    it('should return false', () => {
      expect(areEdgesConnected(edge1, edge2, vertices)).toBe(false);
    });
  });

  describe('when edges have opposing normals', () => {
    const vertices = [makeVertex(0, 0), makeVertex(10, 10)];
    const sharedPoint = makePoint(5, 5);

    const edge1 = makeSingleIntersectionEdge(0, sharedPoint, makeNormal(1, 0));
    const edge2 = makeSingleIntersectionEdge(1, sharedPoint, makeNormal(-1, 0));

    it('should return false', () => {
      expect(areEdgesConnected(edge1, edge2, vertices)).toBe(false);
    });
  });

  describe('when edges have distant intersection points', () => {
    const vertices = [makeVertex(0, 0), makeVertex(10, 10)];
    const normal = makeNormal(1, 0);

    const edge1 = makeSingleIntersectionEdge(0, makePoint(0, 0), normal);
    const edge2 = makeSingleIntersectionEdge(1, makePoint(10, 10), normal);

    it('should return false', () => {
      expect(areEdgesConnected(edge1, edge2, vertices)).toBe(false);
    });
  });

  describe('when edges have multiple intersections', () => {
    const vertices = [makeVertex(0, 0), makeVertex(10, 10)];
    const normal = makeNormal(1, 0);

    const edge1 = makeEdge(0, [
      makeIntersection(makePoint(5, 5), normal),
      makeIntersection(makePoint(7, 7), normal)
    ]);

    const edge2 = makeEdge(1, [
      makeIntersection(makePoint(5, 5), normal),
      makeIntersection(makePoint(3, 3), normal)
    ]);

    it('should return true when at least one intersection matches', () => {
      expect(areEdgesConnected(edge1, edge2, vertices)).toBe(true);
    });
  });
});
