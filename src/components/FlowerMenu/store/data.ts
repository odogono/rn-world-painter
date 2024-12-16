import type { Node } from '../types';

export const simpleData: Node[] = [
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

export const data: Node[] = [
  {
    id: 'root',
    name: 'root',
    children: [
      {
        id: 'move',
        name: 'Move',
        children: [
          {
            id: 'pan',
            name: 'Pan',
            icon: 'pan-tool'
          },
          {
            id: 'zoom_in',
            name: 'Zoom In',
            icon: 'zoom_in_map'
          },
          {
            id: 'zoom_out',
            name: 'Zoom Out',
            icon: 'zoom_out_map'
          },
          {
            id: 'reset',
            name: 'Reset',
            icon: 'refresh'
          }
        ]
      },
      {
        id: 'edit',
        name: 'Edit',
        icon: 'edit'
      },
      {
        id: 'history',
        name: 'History',
        openOnFocus: true,
        children: [
          {
            id: 'undo',
            name: 'Undo',
            icon: 'undo'
          },
          {
            id: 'redo',
            name: 'Redo',
            icon: 'redo'
          }
        ]
      }
    ]
  }
];
