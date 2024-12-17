import type { Mutable, Rect2, Vector2 } from '@types';

export type Vector2WithLayout = { x: string | number; y: string | number };

export type NodeState = {
  id: string;
  name: string;
  icon?: string;
  // event name
  action?: string;
  selectedChild: number;
  children: string[];
  parentId?: string | undefined;
  isOpen: boolean;
  isActive: boolean;
  position: Mutable<Vector2>;
  bounds: Rect2;
};

export type Node = {
  id: string;
  name: string;
  icon?: string;
  action?: string;
  openOnFocus?: boolean;
  children?: Node[];
  position?: Vector2WithLayout;
  isOpen?: boolean;
};
