import type { Mutable, Rect2, Vector2 } from '@types';

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

  position: Mutable<Vector2>;
  bounds: Rect2;
};
