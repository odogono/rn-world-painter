import type { Node } from '../types';

export const menuData: Node[] = [
  {
    id: 'brushOperation',
    name: 'brushOperation',
    icon: 'build',
    isOpen: true,
    position: { x: 'left+10', y: 'vcenter-30' },
    children: [
      {
        id: 'brushOperationAdd',
        name: 'Add',
        icon: 'material-community:vector-union'
      },
      {
        id: 'brushOperationRemove',
        name: 'Remove',
        icon: 'material-community:vector-difference'
      },
      {
        id: 'brushOperationIntersect',
        name: 'Intersect',
        icon: 'material-community:vector-intersection'
      },
      {
        id: 'brushDelete',
        name: 'Delete',
        icon: 'delete-outline'
      }
    ]
  },
  {
    id: 'visibility',
    name: 'Visibility',
    icon: 'visibility',
    position: { x: 'right-80', y: 'vcenter+80' },
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
    position: { x: 'right-80', y: 'vcenter-80' },
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
  },
  {
    id: 'edit',
    name: 'Edit',
    icon: 'edit',
    position: { x: 'right-80', y: 'bottom-80' }
  },
  {
    id: 'pan',
    name: 'Pan',
    icon: 'material-community:pan',
    position: { x: 'right-80', y: 'bottom-160' }
  },
  {
    id: 'palette',
    name: 'Palette',
    icon: 'palette',
    color: 'cyan',
    position: { x: 'hcenter-30', y: 'bottom-80' }
  },
  {
    id: 'brush',
    name: 'Brush',
    icon: 'brush',
    position: { x: 'right-160', y: 'bottom-80' }
  }
];
