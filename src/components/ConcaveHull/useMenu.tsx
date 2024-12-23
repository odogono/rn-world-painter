import React, { useCallback, useMemo, useState } from 'react';

import { createLog } from '@helpers/log';
import { BrushOperation } from '@model/types';
import { useStore, useStoreState } from '@model/useStore';
import { FlowerMenuStoreProvider } from '../FlowerMenu/store/context';

const log = createLog('useMenu');

export const useMenu = () => {
  // const isWorldViewEnabled = useStoreState().use.panViewEnabled();
  const setPanViewEnabled = useStoreState().use.setPanViewEnabled();
  // const [isWorldMoveEnabled, setIsWorldMoveEnabled] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isBrushPaletteOpen, setIsBrushPaletteOpen] = useState(false);

  const setBrushOperation = useStoreState().use.setBrushOperation();
  const brushOperation = useStoreState().use.brushOperation();

  const { zoomOnPoint } = useStore();

  const removeSelectedFeatures = useStoreState().use.removeSelectedFeatures();
  const undo = useStoreState().use.undo();
  const redo = useStoreState().use.redo();

  const onNodeSelect = useCallback(({ id }: { id: string }) => {
    log.debug('[Painter][onNodeSelect]', id);
    switch (id) {
      case 'edit':
        setPanViewEnabled(false);
        break;
      case 'pan':
        setPanViewEnabled(true);
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
      case 'brushOperationAdd':
        setBrushOperation(BrushOperation.ADD);
        break;
      case 'brushOperationRemove':
        setBrushOperation(BrushOperation.SUBTRACT);
        break;
      case 'brushOperationIntersect':
        setBrushOperation(BrushOperation.INTERSECT);
        break;
      case 'brushDelete':
        removeSelectedFeatures();
        break;
      case 'palette':
        setIsPaletteOpen(true);
        break;
      case 'brush':
        setIsBrushPaletteOpen(true);
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
    // isWorldMoveEnabled,
    brushOperation,
    isPaletteOpen,
    setIsPaletteOpen,
    isBrushPaletteOpen,
    setIsBrushPaletteOpen
  };
};
