import { createFlowerMenuStore } from '../store';

describe('FlowerMenuStore', () => {
  it('should initialize with default values', () => {
    const store = createFlowerMenuStore();
    const state = store.getState();

    expect(state.nodes).toEqual({});
  });

  it('should initialize with custom root nodes', () => {
    const customRootNodes = {
      test: {
        id: 'test',
        name: 'Test Node',
        position: { x: 10, y: 20 },
        selectedChild: 0,
        children: [],
        isOpen: false
      }
    };

    const store = createFlowerMenuStore({ nodes: customRootNodes });
    const state = store.getState();

    expect(state.nodes).toEqual(customRootNodes);
  });

  it('should get child node ids', () => {
    const store = createFlowerMenuStore();
    const state = store.getState();

    // Root level nodes
    const rootChildren = state.getChildNodeIds();
    expect(rootChildren).toEqual(['edit', 'move', 'history']);

    // Move submenu children
    const moveChildren = state.getChildNodeIds('move');
    expect(moveChildren).toEqual(['pan', 'zoom_in', 'zoom_out', 'reset']);

    // History submenu children
    const historyChildren = state.getChildNodeIds('history');
    expect(historyChildren).toEqual(['undo', 'redo']);
  });

  it('should get node state', () => {
    const store = createFlowerMenuStore();
    store.getState().initialise();
    const state = store.getState();

    const rootNode = state.getNodeState('root');
    expect(rootNode).toEqual({
      id: 'root',
      name: 'root',
      icon: undefined,
      position: { x: 0, y: 0 },
      selectedChild: 0,
      children: ['edit', 'move', 'history'],
      isOpen: false
    });
  });

  it('should handle node tap', () => {
    const store = createFlowerMenuStore();
    store.getState().initialise();

    // expect(rootNode?.selectedChild).toEqual(0);

    // Initial tap
    store.getState().handleNodeTap('root');

    // Verify the state changes after tap
    expect(store.getState().getNodeIcon('root')).toEqual('open_with');

    store.getState().handleNodeTap('root');
    expect(store.getState().getNodeIcon('root')).toEqual('history');

    // back to first child
    store.getState().handleNodeTap('root');
    expect(store.getState().getNodeIcon('root')).toEqual('edit');
  });
});
