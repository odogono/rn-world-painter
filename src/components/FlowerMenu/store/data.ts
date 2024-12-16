import type { Node } from '../types';

export const simpleData: Node[] = [
  // {
  //   id: 'root',
  //   name: 'Root',
  //   icon: 'edit',
  //   action: 'edit',
  //   position: { x: 355, y: 835 }
  // },
  {
    id: 'edit',
    name: 'Edit',
    icon: 'edit',
    action: 'edit',
    position: { x: 355, y: 835 }
  },
  {
    id: 'pan',
    name: 'Pan',
    icon: 'pan-tool',
    position: { x: 355, y: 835 - 59 - 16 },
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
