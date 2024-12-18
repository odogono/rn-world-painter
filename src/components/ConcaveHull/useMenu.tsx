import React, { useCallback, useMemo, useState } from 'react';

import { createLogger } from '@helpers/log';
import { BrushMode } from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { FlowerMenuStoreProvider } from '../FlowerMenu/store/context';

const log = createLogger('useMenu');

export const useMenu = () => {
  const [isWorldMoveEnabled, setIsWorldMoveEnabled] = useState(true);
  // const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.ADD);
  const setBrushMode = useStoreState().use.setBrushMode();
  const brushMode = useStoreState().use.getBrushMode()();

  const { zoomOnPoint } = useStore();

  const removeSelectedFeatures = useStoreState().use.removeSelectedFeatures();
  const undo = useStoreState().use.undo();
  const redo = useStoreState().use.redo();

  const onNodeSelect = useCallback(({ id }: { id: string }) => {
    log.debug('[Painter][onNodeSelect]', id);
    switch (id) {
      case 'edit':
        setIsWorldMoveEnabled(false);
        break;
      case 'pan':
        setIsWorldMoveEnabled(true);
        break;
      case 'zoomIn':
        zoomOnPoint({ zoomFactor: 4 });
        break;
      case 'zoomOut':
        zoomOnPoint({ zoomFactor: 0.5 });
        break;
      case 'reset':
        zoomOnPoint({ toScale: 1 });
        break;
      case 'brushAdd':
        setBrushMode(BrushMode.ADD);
        break;
      case 'brushRemove':
        setBrushMode(BrushMode.SUBTRACT);
        break;
      case 'brushDelete':
        removeSelectedFeatures();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
    }
  }, []);

  const MenuProvider = useMemo(
    () =>
      ({ children }: React.PropsWithChildren) => (
        <FlowerMenuStoreProvider
          insets={{ left: 10, top: 64, right: 10, bottom: 50 }}
          // onEvent={onFlowerMenuEvent}
          onNodeSelect={onNodeSelect}
        >
          {children}
        </FlowerMenuStoreProvider>
      ),
    [onNodeSelect]
  );

  return {
    MenuProvider,
    isWorldMoveEnabled,
    brushMode
  };
};
