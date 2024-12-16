import type { Node } from '../types';

export const menuData: Node[] = [
  {
    id: 'brush',
    name: 'Brush',
    icon: 'brush',
    isOpen: true,
    position: { x: 10, y: 356 },
    children: [
      {
        id: 'brushAdd',
        name: 'Add',
        icon: 'add-circle-outline'
      },
      {
        id: 'brushRemove',
        name: 'Remove',
        icon: 'remove-circle-outline'
      }
    ]
  },
  {
    id: 'visibility',
    name: 'Visibility',
    icon: 'visibility',
    position: { x: 361, y: 560 },
    children: [
      {
        id: 'zoomIn',
        name: 'Zoom In',
        icon: 'zoom-in'
      },
      {
        id: 'zoomOut',
        name: 'Zoom Out',
        icon: 'zoom-out'
      },
      {
        id: 'reset',
        name: 'Reset',
        icon: 'refresh'
      }
    ]
  },
  {
    id: 'history',
    name: 'History',
    icon: 'history',
    position: { x: 361, y: 356 },
    children: [
      {
        id: 'undo',
        name: 'Undo',
        icon: 'undo',
        action: 'undo'
      },
      {
        id: 'redo',
        name: 'Redo',
        icon: 'redo',
        action: 'redo'
      }
    ]
  },
  {
    id: 'edit',
    name: 'Edit',
    icon: 'edit',
    action: 'edit',
    position: { x: 361, y: 835 }
  },
  {
    id: 'pan',
    name: 'Pan',
    icon: 'pan-tool',
    position: { x: 361, y: 835 - 59 - 16 },
    action: 'pan'
  }
];
